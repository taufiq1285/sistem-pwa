/**
 * Supabase Mock - FIXED VERSION v2
 * Mengatasi circular reference error dengan proper initialization
 */

import { vi } from "vitest";

export const createSupabaseMock = () => {
  // Query builder yang bisa di-chain - Fixed circular reference
  const createQueryBuilder = (): any => {
    const builder = {} as any;

    // Assign all methods after builder is declared
    builder.select = vi.fn().mockReturnValue(builder);
    builder.insert = vi.fn().mockReturnValue(builder);
    builder.update = vi.fn().mockReturnValue(builder);
    builder.delete = vi.fn().mockReturnValue(builder);
    builder.upsert = vi.fn().mockReturnValue(builder);
    builder.eq = vi.fn().mockReturnValue(builder);
    builder.neq = vi.fn().mockReturnValue(builder);
    builder.gt = vi.fn().mockReturnValue(builder);
    builder.gte = vi.fn().mockReturnValue(builder);
    builder.lt = vi.fn().mockReturnValue(builder);
    builder.lte = vi.fn().mockReturnValue(builder);
    builder.like = vi.fn().mockReturnValue(builder);
    builder.ilike = vi.fn().mockReturnValue(builder);
    builder.is = vi.fn().mockReturnValue(builder);
    builder.in = vi.fn().mockReturnValue(builder);
    builder.contains = vi.fn().mockReturnValue(builder);
    builder.containedBy = vi.fn().mockReturnValue(builder);
    builder.range = vi.fn().mockReturnValue(builder);
    builder.or = vi.fn().mockReturnValue(builder);
    builder.not = vi.fn().mockReturnValue(builder);
    builder.filter = vi.fn().mockReturnValue(builder);
    builder.match = vi.fn().mockReturnValue(builder);
    builder.order = vi.fn().mockReturnValue(builder);
    builder.limit = vi.fn().mockReturnValue(builder);
    builder.offset = vi.fn().mockReturnValue(builder);

    // Terminal methods yang return Promise
    builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
    builder.maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: null });
    builder.csv = vi.fn().mockResolvedValue({ data: null, error: null });

    // Default then untuk promise-like behavior
    builder.then = vi.fn((resolve) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
    );

    return builder;
  };

  // Storage mock yang lengkap
  const createStorageBucket = () => ({
    upload: vi.fn().mockResolvedValue({ data: { path: "" }, error: null }),
    download: vi.fn().mockResolvedValue({ data: null, error: null }),
    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    list: vi.fn().mockResolvedValue({ data: [], error: null }),
    getPublicUrl: vi.fn((path: string) => ({
      data: {
        publicUrl: `https://example.com/storage/v1/object/public/bucket/${path}`,
      },
    })),
    createSignedUrl: vi.fn().mockResolvedValue({
      data: { signedUrl: "https://example.com/signed-url" },
      error: null,
    }),
    createSignedUrls: vi.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
    move: vi.fn().mockResolvedValue({ data: null, error: null }),
    copy: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  return {
    from: vi.fn(() => createQueryBuilder()),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),

    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
      resetPasswordForEmail: vi
        .fn()
        .mockResolvedValue({ data: null, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: null, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },

    storage: {
      from: vi.fn(() => createStorageBucket()),
    },
  };
};

export const supabaseMock = createSupabaseMock();
