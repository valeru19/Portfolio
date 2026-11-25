/**
 * Technologies present in legacy CONTENT but without confirmed experience.
 * Do not import into rendered stack/logo grids until the owner confirms.
 *
 * Pending: Kubernetes, Apache, AWS S3, Figma.
 */
export const pendingStackItems = [
  { id: "kubernetes", label: "Kubernetes", logo: "kubernetes", src: "assets/kubernetes.png" },
  { id: "apache", label: "Apache", logo: "apache", src: "assets/apache.png" },
  { id: "aws-s3", label: "AWS S3", logo: "aws-s3", src: "assets/aws-s3.png" },
  { id: "figma", label: "Figma", logo: "figma", src: "assets/figma.png" },
] as const;
