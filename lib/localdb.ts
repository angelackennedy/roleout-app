import localforage from "localforage";

const postsStore = localforage.createInstance({
  name: "RoleOut",
  storeName: "posts",
  description: "Post metadata storage",
});

const blobsStore = localforage.createInstance({
  name: "RoleOut",
  storeName: "blobs",
  description: "Media blob storage",
});

const commentsStore = localforage.createInstance({
  name: "RoleOut",
  storeName: "comments",
  description: "Comments storage",
});

export const commentsChannel = new BroadcastChannel("roleout-comments");

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface PostMetadata {
  id: string;
  kind: "image" | "video";
  caption?: string;
  created_at: string;
  likes: number;
  comments_count: number;
}

interface Post extends PostMetadata {
  objectUrl: string;
}

interface Comment {
  id: string;
  postId: string;
  body: string;
  user: string;
  created_at: string;
}

export async function initLocalDB(): Promise<void> {
  try {
    await postsStore.ready();
    await blobsStore.ready();
    await commentsStore.ready();
    console.log("[LocalDB] Initialized successfully");
  } catch (error) {
    console.error("[LocalDB] Initialization error:", error);
    throw error;
  }
}

export async function savePost(
  file: File,
  caption?: string
): Promise<{ id: string }> {
  const id = generateId();
  const kind = file.type.startsWith("image/") ? "image" : "video";

  const metadata: PostMetadata = {
    id,
    kind,
    caption,
    created_at: new Date().toISOString(),
    likes: 0,
    comments_count: 0,
  };

  await postsStore.setItem(id, metadata);
  await blobsStore.setItem(`blob:${id}`, file);

  console.log(`[LocalDB] Saved post ${id} (${kind})`);
  return { id };
}

export async function listPosts(
  offset: number,
  limit: number
): Promise<Post[]> {
  const allKeys = await postsStore.keys();
  const posts: Post[] = [];

  for (const key of allKeys) {
    const metadata = await postsStore.getItem<PostMetadata>(key);
    if (!metadata) continue;

    const blob = await blobsStore.getItem<Blob>(`blob:${metadata.id}`);
    if (!blob) continue;

    const objectUrl = URL.createObjectURL(blob);
    posts.push({ ...metadata, objectUrl });
  }

  posts.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return posts.slice(offset, offset + limit);
}

export async function likePost(id: string): Promise<void> {
  const metadata = await postsStore.getItem<PostMetadata>(id);
  if (!metadata) {
    throw new Error(`Post ${id} not found`);
  }

  metadata.likes += 1;
  await postsStore.setItem(id, metadata);
  console.log(`[LocalDB] Liked post ${id}, now ${metadata.likes} likes`);
}

export async function getPost(id: string): Promise<Post | null> {
  const metadata = await postsStore.getItem<PostMetadata>(id);
  if (!metadata) return null;

  const blob = await blobsStore.getItem<Blob>(`blob:${id}`);
  if (!blob) return null;

  const objectUrl = URL.createObjectURL(blob);
  return { ...metadata, objectUrl };
}

export async function addComment(
  postId: string,
  body: string,
  user: string = "Anonymous"
): Promise<{ id: string }> {
  const commentId = generateId();

  const comment: Comment = {
    id: commentId,
    postId,
    body,
    user,
    created_at: new Date().toISOString(),
  };

  await commentsStore.setItem(commentId, comment);

  const metadata = await postsStore.getItem<PostMetadata>(postId);
  if (metadata) {
    metadata.comments_count += 1;
    await postsStore.setItem(postId, metadata);
  }

  commentsChannel.postMessage({
    type: "comment",
    postId,
    comment,
  });

  console.log(`[LocalDB] Added comment ${commentId} to post ${postId}`);
  return { id: commentId };
}

export async function listComments(
  postId: string
): Promise<Array<{ id: string; body: string; user: string; created_at: string }>> {
  const allKeys = await commentsStore.keys();
  const comments: Comment[] = [];

  for (const key of allKeys) {
    const comment = await commentsStore.getItem<Comment>(key);
    if (comment && comment.postId === postId) {
      comments.push(comment);
    }
  }

  comments.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return comments;
}
