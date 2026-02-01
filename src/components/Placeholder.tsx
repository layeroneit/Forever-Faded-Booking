type Props = { title: string };

export default function Placeholder({ title }: Props) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">Coming soon. Use Amplify Data manager or API for now.</p>
    </div>
  );
}
