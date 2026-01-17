/**
 * Field Mapping Helpers
 * Purpose: Handle DB vs Type field name inconsistencies
 */

import type { Soal } from "@/types/kuis.types";

export function mapSoalToDatabase(data: Partial<Soal>): Record<string, any> {
  const dbData: Record<string, any> = {};

  // Direct mappings
  if (data.id !== undefined) dbData.id = data.id;
  if (data.kuis_id !== undefined) dbData.kuis_id = data.kuis_id;
  if (data.pertanyaan !== undefined) dbData.pertanyaan = data.pertanyaan;
  if (data.poin !== undefined) dbData.poin = data.poin;
  if (data.urutan !== undefined) dbData.urutan = data.urutan;
  if (data.jawaban_benar !== undefined)
    dbData.jawaban_benar = data.jawaban_benar;
  if (data.created_at !== undefined) dbData.created_at = data.created_at;
  if (data.updated_at !== undefined) dbData.updated_at = data.updated_at;

  // Field name transformations
  if (data.tipe_soal !== undefined) dbData.tipe = data.tipe_soal;
  if (data.opsi_jawaban !== undefined)
    dbData.pilihan_jawaban = data.opsi_jawaban;
  if (data.penjelasan !== undefined) dbData.pembahasan = data.penjelasan;

  return dbData;
}

export function mapSoalFromDatabase(dbData: Record<string, any>): Soal {
  const typeData: Partial<Soal> = {};

  // Direct mappings
  if (dbData.id !== undefined) typeData.id = dbData.id;
  if (dbData.kuis_id !== undefined) typeData.kuis_id = dbData.kuis_id;
  if (dbData.pertanyaan !== undefined) typeData.pertanyaan = dbData.pertanyaan;
  if (dbData.poin !== undefined) typeData.poin = dbData.poin;
  if (dbData.urutan !== undefined) typeData.urutan = dbData.urutan;
  if (dbData.jawaban_benar !== undefined)
    typeData.jawaban_benar = dbData.jawaban_benar;
  if (dbData.created_at !== undefined) typeData.created_at = dbData.created_at;
  if (dbData.updated_at !== undefined) typeData.updated_at = dbData.updated_at;

  // Field name transformations
  if (dbData.tipe !== undefined) typeData.tipe_soal = dbData.tipe;
  if (dbData.pilihan_jawaban !== undefined)
    typeData.opsi_jawaban = dbData.pilihan_jawaban;
  if (dbData.pembahasan !== undefined) typeData.penjelasan = dbData.pembahasan;

  return typeData as Soal;
}

export function mapSoalArrayFromDatabase(
  dbDataArray: Record<string, any>[],
): Soal[] {
  return dbDataArray.map((dbData) => mapSoalFromDatabase(dbData));
}

const FIELD_MAPPINGS = {
  type_to_db: {
    opsi_jawaban: "pilihan_jawaban",
    penjelasan: "pembahasan",
    tipe_soal: "tipe",
  } as Record<string, string>,
  db_to_type: {
    pilihan_jawaban: "opsi_jawaban",
    pembahasan: "penjelasan",
    tipe: "tipe_soal",
  } as Record<string, string>,
};

export function mapFieldsToDatabase(
  data: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const dbKey = FIELD_MAPPINGS.type_to_db[key] || key;
    result[dbKey] = value;
  }
  return result;
}

export function mapFieldsFromDatabase(
  data: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const typeKey = FIELD_MAPPINGS.db_to_type[key] || key;
    result[typeKey] = value;
  }
  return result;
}
