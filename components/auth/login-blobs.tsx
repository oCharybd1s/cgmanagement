import styles from "./login-blobs.module.css";

export function LoginBlobs() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={`${styles.blob} ${styles.blobA}`} />
      <div className={`${styles.blob} ${styles.blobB}`} />
      <div className={`${styles.blob} ${styles.blobC}`} />
      <div className={`${styles.blob} ${styles.blobD}`} />
      <div className={`${styles.blob} ${styles.blobE}`} />
    </div>
  );
}
