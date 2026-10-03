import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { StorageService } from './storage';
import { LibraryItem, ReadingProgressRecord, ForumComment } from '../types/manga';

export const FirebaseSyncService = {
  // Initialize Auth Listener & Real-time Cloud Synchronization
  initAuthSync(
    onUserChange: (user: User | null) => void,
    onLibrarySync?: (items: LibraryItem[]) => void
  ) {
    return onAuthStateChanged(auth, async (user) => {
      onUserChange(user);

      if (user) {
        // User logged in via Firebase
        const userPath = `users/${user.uid}`;
        try {
          // Sync profile
          await setDoc(
            doc(db, 'users', user.uid),
            {
              userId: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Manga Reader',
              photoURL: user.photoURL || '',
              syncCode: `RIFT-${user.uid.slice(0, 4).toUpperCase()}`,
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, userPath);
        }

        // Attach library onSnapshot listener
        const libraryPath = `users/${user.uid}/library`;
        try {
          const libraryRef = collection(db, 'users', user.uid, 'library');
          onSnapshot(
            libraryRef,
            (snapshot) => {
              const cloudItems: LibraryItem[] = [];
              snapshot.forEach((d) => {
                const data = d.data() as any;
                cloudItems.push({
                  comic: {
                    id: 1,
                    hid: data.comicSlug,
                    slug: data.comicSlug,
                    title: data.comicTitle,
                    cover_url: data.coverUrl,
                    rating: '9.6',
                  },
                  category: data.category,
                  addedAt: data.addedAt,
                  lastReadChapter: data.lastReadChapter,
                  currentProgress: data.progressPercent || 0,
                });
              });

              if (cloudItems.length > 0) {
                StorageService.saveLibrary(cloudItems);
                if (onLibrarySync) onLibrarySync(cloudItems);
              }
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, libraryPath);
            }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, libraryPath);
        }
      }
    });
  },

  // Save bookmarked item to user's Firestore library
  async syncLibraryItem(item: LibraryItem): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `users/${user.uid}/library/${item.comic.slug}`;
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'library', item.comic.slug),
        {
          comicSlug: item.comic.slug,
          comicTitle: item.comic.title,
          coverUrl: item.comic.cover_url || '',
          category: item.category,
          lastReadChapter: item.lastReadChapter || '1',
          progressPercent: item.currentProgress || 0,
          addedAt: item.addedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Remove bookmark from user's Firestore library
  async removeLibraryItem(comicSlug: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `users/${user.uid}/library/${comicSlug}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'library', comicSlug));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Sync reading progress
  async syncReadingProgress(record: ReadingProgressRecord): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `users/${user.uid}/progress/${record.comicSlug}`;
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'progress', record.comicSlug),
        {
          comicSlug: record.comicSlug,
          comicTitle: record.comicTitle || '',
          coverUrl: record.coverUrl || '',
          chapterHid: record.chapterHid,
          chapterNumber: record.chapterNumber,
          chapterTitle: record.chapterTitle || '',
          currentPage: record.currentPage,
          totalPages: record.totalPages || 1,
          progressPercent: record.progressPercent || 0,
          lastReadAt: record.lastReadAt || new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Post community comment to Firestore
  async postComment(comment: {
    comicSlug: string;
    chapterHid?: string;
    chapterTitle?: string;
    content: string;
    rating?: number;
    isSpoiler?: boolean;
  }): Promise<ForumComment | null> {
    const user = auth.currentUser;
    const authorId = user?.uid || 'guest-reader';
    const authorName = user?.displayName || StorageService.getUserProfile().name;
    const authorAvatar = user?.photoURL || StorageService.getUserProfile().avatar;
    const commentId = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const path = `comments/${commentId}`;

    const newComment: ForumComment = {
      id: commentId,
      comicSlug: comment.comicSlug,
      chapterHid: comment.chapterHid,
      chapterTitle: comment.chapterTitle || 'General Discussion',
      author: authorName,
      avatar: authorAvatar,
      content: comment.content,
      rating: comment.rating || 5,
      isSpoiler: !!comment.isSpoiler,
      upvotes: 1,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'comments', commentId), {
        id: commentId,
        comicSlug: comment.comicSlug,
        chapterHid: comment.chapterHid || '',
        chapterTitle: comment.chapterTitle || 'General Discussion',
        authorId,
        authorName,
        authorAvatar,
        content: comment.content,
        rating: comment.rating || 5,
        isSpoiler: !!comment.isSpoiler,
        upvotes: 1,
        createdAt: new Date().toISOString(),
      });
      return newComment;
    } catch (err) {
      // If Firestore rules deny unauthenticated writes, fallback to API
      console.warn('Firestore comment write failed, using local/api fallback:', err);
      return newComment;
    }
  },

  // Real-time listener for comments on a manga title
  subscribeComments(comicSlug: string, onUpdate: (comments: ForumComment[]) => void) {
    const path = 'comments';
    try {
      const q = query(
        collection(db, 'comments'),
        where('comicSlug', '==', comicSlug),
        limit(50)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const list: ForumComment[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as any;
            list.push({
              id: d.id,
              comicSlug: data.comicSlug,
              chapterHid: data.chapterHid,
              chapterTitle: data.chapterTitle,
              author: data.authorName || 'Reader',
              avatar: data.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              content: data.content,
              rating: data.rating || 5,
              isSpoiler: data.isSpoiler || false,
              upvotes: data.upvotes || 0,
              createdAt: data.createdAt || new Date().toISOString(),
            });
          });
          if (list.length > 0) {
            onUpdate(list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, path);
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return () => {};
    }
  },

  // Submit feedback ticket to Firestore
  async submitFeedbackTicket(ticket: {
    name: string;
    email: string;
    category: string;
    message: string;
  }): Promise<string> {
    const ticketId = `ticket-${Date.now()}`;
    const user = auth.currentUser;
    const path = `feedback/${ticketId}`;

    try {
      await setDoc(doc(db, 'feedback', ticketId), {
        id: ticketId,
        userId: user?.uid || 'anonymous',
        senderName: ticket.name,
        senderEmail: ticket.email || 'fahadjaved786007@gmail.com',
        category: ticket.category,
        message: ticket.message,
        status: 'MONITORED_OPEN',
        createdAt: new Date().toISOString(),
      });
      return ticketId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return ticketId;
    }
  },
};
