import { Flow } from "./flow";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.head}>
        <h1>Healed</h1>
        <p>See your brows healed before the needle.</p>
      </header>
      <Flow />
    </main>
  );
}
