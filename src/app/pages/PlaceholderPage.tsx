import { Construction } from 'lucide-react';
import { Card, CardBody } from '../components/ui/card';

interface Props {
  title: string;
  sprint?: string;
}

export default function PlaceholderPage({ title, sprint = 'à venir' }: Props) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-stone-900">{title}</h1>
      <p className="mt-2 text-stone-600">Module en cours de développement — Sprint {sprint}.</p>

      <Card className="mt-6">
        <CardBody className="py-12 flex flex-col items-center text-center">
          <span className="size-14 grid place-items-center rounded-full bg-primary-50 text-primary-700">
            <Construction size={28} />
          </span>
          <h3 className="mt-4 text-stone-900">Bientôt disponible</h3>
          <p className="mt-2 max-w-md text-stone-600">
            Cette section fait partie d'un sprint ultérieur. Les écrans et fonctionnalités
            associés seront livrés progressivement.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
