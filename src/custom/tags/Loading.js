function areAnyLoading(src) {
  if (Array.isArray(src)) {
    return src.reduce(
      (acc, data) => areAnyLoading(data) || acc,
      false
    );
  }

  return src && src.loading && src.loading.state
}

export function Loading({
  src,
  children,
  placeholder = children,
  isLoading = areAnyLoading(src),
}) {
  if (!src) return children;
  if (isLoading) return placeholder;

  return children;
}
