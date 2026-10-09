import { Link } from 'react-router-dom';
import { Hourglass } from 'lucide-react';

export default function NotFound({ standalone }: { standalone?: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: standalone ? '100vh' : undefined,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 24,
        textAlign: 'center',
        color: 'var(--muted)',
      }}
    >
      <Hourglass size={40} strokeWidth={1.4} aria-hidden="true" />
      <h1 style={{ margin: 0, color: 'var(--text)', fontSize: 26 }}>Страница ушла думать</h1>
      <p style={{ margin: 0, maxWidth: 420 }}>Как и большинство наших клиентов. Мы вам перезвоним, когда она вернётся.</p>
      <Link to={standalone ? '/' : '/app/leads'} style={{ marginTop: 8 }}>
        {standalone ? 'На главную' : 'Вернуться к сделкам'}
      </Link>
    </div>
  );
}
