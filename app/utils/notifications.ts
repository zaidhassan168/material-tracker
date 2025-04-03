import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();

export const fetchUserNotifications = async () => {

const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const markNotificationAsRead = async (notificationId: string) => {
  const ref = doc(db, "notifications", notificationId);
  await updateDoc(ref, { seen: true });
  return true;
};
