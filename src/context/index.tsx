import { useContext, createContext, useEffect, useState } from "react";
import { signInWithPopup, onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase";

export type Campaign = {
  pId: string;
  owner: string;
  title: string;
  description: string;
  targetCents: number;
  deadline: number;
  amountCollectedCents: number;
  image: string;
};

export type Donation = {
  donator: string;
  donationCents: number;
  createdAt: number;
};

type CreateCampaignForm = {
  title: string;
  description: string;
  targetCents: number;
  deadline: number;
  image: string;
};

type StateContextType = {
  address: string | undefined;
  connect: () => void;
  createCampaign: (form: CreateCampaignForm) => Promise<Campaign>;
  getCampaigns: () => Promise<Campaign[]>;
  getUserCampaigns: () => Promise<Campaign[]>;
  donate: (
    pId: string,
    amountCents: number,
  ) => Promise<{ balanceCents: number }>;
  getDonations: (pId: string) => Promise<Donation[]>;
  getBalance: () => Promise<number>;
  topUpBalance: (amountCents: number) => Promise<number>;
};

const StateContext = createContext<StateContextType | undefined>(undefined);

const campaignFromDoc = (
  docSnap: QueryDocumentSnapshot<DocumentData>,
): Campaign => {
  const data = docSnap.data();
  return {
    pId: docSnap.id,
    owner: data.ownerAddress,
    title: data.title,
    description: data.description,
    targetCents: data.targetCents,
    deadline: data.deadline,
    amountCollectedCents: data.amountCollectedCents ?? 0,
    image: data.image,
  };
};

export const StateContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [address, setAddress] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setAddress(user?.uid);
    });
    return unsubscribe;
  }, []);

  const connect = () => {
    signInWithPopup(auth, googleProvider);
  };

  const createCampaign = async (form: CreateCampaignForm) => {
    const campaignsRef = collection(db, "campaigns");
    const docRef = await addDoc(campaignsRef, {
      ownerAddress: address,
      title: form.title,
      description: form.description,
      targetCents: form.targetCents,
      deadline: form.deadline,
      image: form.image,
      amountCollectedCents: 0,
      createdAt: serverTimestamp(),
    });
    const snap = await getDoc(docRef);
    return campaignFromDoc(snap as QueryDocumentSnapshot<DocumentData>);
  };

  const getCampaigns = async () => {
    const snap = await getDocs(collection(db, "campaigns"));
    return snap.docs.map(campaignFromDoc);
  };

  const getUserCampaigns = async () => {
    const q = query(
      collection(db, "campaigns"),
      where("ownerAddress", "==", address),
    );
    const snap = await getDocs(q);
    return snap.docs.map(campaignFromDoc);
  };

  const getDonations = async (pId: string) => {
    const q = query(
      collection(db, "campaigns", pId, "donations"),
      orderBy("createdAt", "asc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        donator: data.donatorAddress,
        donationCents: data.amountCents,
        createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
      };
    });
  };

  const donate = async (pId: string, amountCents: number) => {
    const balanceRef = doc(db, "balances", address as string);
    const campaignRef = doc(db, "campaigns", pId);
    const donationRef = doc(collection(db, "campaigns", pId, "donations"));

    let balanceCents = 0;

    await runTransaction(db, async (tx) => {
      const balanceSnap = await tx.get(balanceRef);
      const currentBalance = balanceSnap.exists()
        ? balanceSnap.data().balanceCents
        : 0;

      if (currentBalance < amountCents) {
        throw new Error("Insufficient balance");
      }

      const campaignSnap = await tx.get(campaignRef);
      const currentCollected = campaignSnap.data()?.amountCollectedCents ?? 0;

      balanceCents = currentBalance - amountCents;

      tx.set(balanceRef, { balanceCents }, { merge: true });
      tx.update(campaignRef, {
        amountCollectedCents: currentCollected + amountCents,
      });
      tx.set(donationRef, {
        donatorAddress: address,
        amountCents,
        createdAt: serverTimestamp(),
      });
    });

    return { balanceCents };
  };

  const getBalance = async () => {
    if (!address) return 0;
    const snap = await getDoc(doc(db, "balances", address));
    return snap.exists() ? snap.data().balanceCents : 0;
  };

  const topUpBalance = async (amountCents: number) => {
    const balanceRef = doc(db, "balances", address as string);
    let balanceCents = 0;

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(balanceRef);
      const current = snap.exists() ? snap.data().balanceCents : 0;
      balanceCents = current + amountCents;
      tx.set(balanceRef, { balanceCents }, { merge: true });
    });

    return balanceCents;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        connect,
        createCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations,
        getBalance,
        topUpBalance,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
