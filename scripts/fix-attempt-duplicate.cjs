/**
 * Fix: "Record already exists" error saat start attempt
 * Tambahkan error handling untuk conflict dan retry logic
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/kuis.api.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const oldFunction = `async function startAttemptImpl(data: StartAttemptData): Promise<AttemptKuis> {
  try {
    // Get all existing attempts for this quiz and mahasiswa
    const existingAttempts = await getAttempts({
      kuis_id: data.kuis_id,
      mahasiswa_id: data.mahasiswa_id,
    });

    // ✅ Check if there's an ongoing attempt (in_progress)
    const ongoingAttempt = existingAttempts.find(
      (attempt) => attempt.status === "in_progress"
    );

    if (ongoingAttempt) {
      console.log("✅ Resuming existing attempt:", ongoingAttempt.id);
      return ongoingAttempt; // Resume existing attempt
    }

    // ✅ Check max_attempts (if set)
    const quiz = await getKuisById(data.kuis_id);
    if (quiz.max_attempts && existingAttempts.length >= quiz.max_attempts) {
      throw new Error(
        \`Anda sudah mencapai batas maksimal \${quiz.max_attempts} kali percobaan\`
      );
    }

    // ✅ Create new attempt
    const attemptNumber = existingAttempts.length + 1;

    const attemptData = {
      kuis_id: data.kuis_id,
      mahasiswa_id: data.mahasiswa_id,
      attempt_number: attemptNumber,
      status: "in_progress" as const,
      started_at: new Date().toISOString(),
    };

    console.log("✅ Creating new attempt #", attemptNumber);
    return await insert<AttemptKuis>("attempt_kuis", attemptData);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "startAttempt");
    throw apiError;
  }
}`;

const newFunction = `async function startAttemptImpl(data: StartAttemptData): Promise<AttemptKuis> {
  try {
    // Get all existing attempts for this quiz and mahasiswa
    const existingAttempts = await getAttempts({
      kuis_id: data.kuis_id,
      mahasiswa_id: data.mahasiswa_id,
    });

    // ✅ Check if there's an ongoing attempt (in_progress)
    const ongoingAttempt = existingAttempts.find(
      (attempt) => attempt.status === "in_progress"
    );

    if (ongoingAttempt) {
      console.log("✅ Resuming existing attempt:", ongoingAttempt.id);
      return ongoingAttempt; // Resume existing attempt
    }

    // ✅ Check max_attempts (if set)
    const quiz = await getKuisById(data.kuis_id);
    if (quiz.max_attempts && existingAttempts.length >= quiz.max_attempts) {
      throw new Error(
        \`Anda sudah mencapai batas maksimal \${quiz.max_attempts} kali percobaan\`
      );
    }

    // ✅ Create new attempt
    const attemptNumber = existingAttempts.length + 1;

    const attemptData = {
      kuis_id: data.kuis_id,
      mahasiswa_id: data.mahasiswa_id,
      attempt_number: attemptNumber,
      status: "in_progress" as const,
      started_at: new Date().toISOString(),
    };

    console.log("✅ Creating new attempt #", attemptNumber);

    try {
      return await insert<AttemptKuis>("attempt_kuis", attemptData);
    } catch (insertError: any) {
      // Handle duplicate attempt (race condition)
      if (insertError?.code === "CONFLICT" || insertError?.code === "23505") {
        console.log("⚠️ Attempt already exists, fetching existing attempt...");

        // Retry getting attempts (might be cache issue)
        const retryAttempts = await getAttempts({
          kuis_id: data.kuis_id,
          mahasiswa_id: data.mahasiswa_id,
        });

        const existingAttempt = retryAttempts.find(
          (attempt) => attempt.status === "in_progress"
        );

        if (existingAttempt) {
          console.log("✅ Found existing attempt:", existingAttempt.id);
          return existingAttempt;
        }
      }

      // If not a conflict error or can't find existing attempt, rethrow
      throw insertError;
    }
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "startAttempt");
    throw apiError;
  }
}`;

if (content.includes('console.log("✅ Creating new attempt #", attemptNumber);')) {
  content = content.replace(oldFunction, newFunction);
  console.log('✅ Fixed startAttemptImpl function');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✅ File updated successfully!');
} else {
  console.log('⚠️ startAttemptImpl already fixed or not found');
}
