"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Coleções totalmente independentes — nunca misturar Café e Queijos. */
export const COLLECTIONS = {
  cafeProducao: "cafe_producao",
  cafeVendas: "cafe_vendas",
  queijosCompras: "queijos_compras",
  queijosVendas: "queijos_vendas",
  queijosTipos: "queijos_tipos",
} as const;

export type FirestoreRecord = {
  id: string;
  createdAt: number;
  updatedAt?: number;
};

type InputRecord<T> = Omit<T, keyof FirestoreRecord> & { createdAt?: number };

export function useCollection<T extends FirestoreRecord>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        const records = snapshot.docs.map((document) => ({
          ...(document.data() as Omit<T, "id">),
          id: document.id,
        })) as T[];
        records.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setData(records);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [collectionName]);

  return { data, loading, error };
}

export async function createRecord<T extends FirestoreRecord>(
  collectionName: string,
  record: InputRecord<T>,
): Promise<string> {
  const database = db;
  if (!database) throw new Error("Firebase não configurado. Preencha o .env.local.");
  const reference = await addDoc(collection(database, collectionName), {
    ...record,
    createdAt: record.createdAt ?? Date.now(),
  });
  return reference.id;
}

export async function updateRecord<T extends FirestoreRecord>(
  collectionName: string,
  id: string,
  record: Partial<Omit<T, keyof FirestoreRecord>>,
): Promise<void> {
  const database = db;
  if (!database) throw new Error("Firebase não configurado. Preencha o .env.local.");
  await updateDoc(doc(database, collectionName, id), {
    ...record,
    updatedAt: Date.now(),
  });
}

export async function deleteRecord(collectionName: string, id: string): Promise<void> {
  const database = db;
  if (!database) throw new Error("Firebase não configurado. Preencha o .env.local.");
  await deleteDoc(doc(database, collectionName, id));
}

/** Usado apenas pelo carregador de dados de teste. */
export async function seedRecords<T extends FirestoreRecord>(
  collectionName: string,
  records: InputRecord<T>[],
): Promise<void> {
  const database = db;
  if (!database) throw new Error("Firebase não configurado. Preencha o .env.local.");
  const batch = writeBatch(database);
  records.forEach((record, index) => {
    const reference = doc(collection(database, collectionName));
    batch.set(reference, {
      ...record,
      createdAt: Date.now() + index,
    });
  });
  await batch.commit();
}

export function useRemoverRegistro(collectionName: string) {
  const [removendo, setRemovendo] = useState<string | null>(null);

  const remover = useCallback(
    async (id: string) => {
      setRemovendo(id);
      try {
        await deleteRecord(collectionName, id);
      } finally {
        setRemovendo(null);
      }
    },
    [collectionName],
  );

  return { remover, removendo };
}
