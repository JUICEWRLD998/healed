import { Flow } from "./flow";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.head}>
        <h1>Healed</h1>
        <p>See how permanent makeup looks once it has healed and aged, before the needle touches skin.</p>
      </header>
      <Flow />
    </main>
  );
}
