// This file shows the correct mock pattern for dosen tests

// For getMyMataKuliah test:
// The implementation does:
// 1. await supabase.from('kelas').select(...).eq(...).eq(...)
//    -> needs to resolve to { data: kelasData, error: null }
// 2. FOR EACH mata_kuliah IN map:
//    a. await supabase.from('kelas').select('id').eq(...).eq(...)
//       -> needs to resolve to { data: [{ id: "..." }], error: null }
//    b. await supabase.from('kelas_mahasiswa').select(...).in(...)
//       -> needs to resolve to { count: X, error: null }

// CORRECT pattern:
// const builder = createBuilder();
// (builder as any).then = vi.fn((onFulfilled) =>
//   Promise.resolve({ data: testData, error: null }).then(onFulfilled)
// );

// For selects that chain and resolve to counts, need:
// const countBuilder = createBuilder();
// (countBuilder as any).then = vi.fn((onFulfilled) =>
//   Promise.resolve({ count: 20, error: null }).then(onFulfilled)
// );

// KEY INSIGHT: When implementation does `const { data, error } = await query`,
// the query object needs a `.then()` method that converts to a thenable
