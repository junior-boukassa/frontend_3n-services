import { Building2, Handshake, ShieldCheck, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSeo } from '../../components/public/PublicLayout';
const cta = (
  <div className="mt-14 rounded-3xl bg-brand-700 p-10 text-center text-white">
    <h2 className="text-3xl font-bold">Une mobilité plus simple commence ici</h2>
    <p className="mx-auto mt-3 max-w-xl text-brand-100">
      Découvrez les offres disponibles ou rejoignez la plateforme comme agence.
    </p>
    <div className="mt-6 flex justify-center gap-3">
      <Link className="btn bg-white text-brand-700" to="/vehicles">
        Voir les véhicules
      </Link>
      <Link className="btn border border-white/30 text-white" to="/register">
        Créer un compte
      </Link>
    </div>
  </div>
);
export function AboutPage() {
  useSeo(
    'À propos — 3N Services',
    'Découvrez la mission, la vision et les engagements de 3N Services.',
  );
  return (
    <Content title="Une plateforme pensée pour rapprocher voyageurs et agences" eyebrow="À propos">
      <p>
        3N Services simplifie la recherche, la comparaison et la réservation de véhicules. Notre
        mission est de rendre chaque étape claire, de la disponibilité au suivi du paiement.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          [Target, 'Notre mission', 'Rendre la location automobile accessible et transparente.'],
          [
            Handshake,
            'Notre vision',
            'Créer un écosystème durable entre clients et agences professionnelles.',
          ],
          [
            ShieldCheck,
            'Nos engagements',
            'Traçabilité des actions, avis liés aux réservations et contrôle des accès.',
          ],
        ].map(([Icon, t, d]) => (
          <div className="card" key={t as string}>
            <Icon className="text-brand-600" />
            <h2 className="mt-4 font-bold">{t as string}</h2>
            <p className="mt-2 text-sm text-slate-500">{d as string}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 grid gap-8 rounded-3xl bg-white p-8 dark:bg-slate-900 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Pour les clients</h2>
          <p className="mt-3 text-slate-500">
            Des prix lisibles, une disponibilité contrôlée et un espace unique pour les
            réservations, paiements et avis.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Pour les agences</h2>
          <p className="mt-3 text-slate-500">
            Une flotte centralisée, des demandes organisées et des indicateurs directement issus de
            l’activité.
          </p>
        </div>
      </div>
      {cta}
    </Content>
  );
}
const contactSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  email: z.string().email('E-mail invalide'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Sujet requis'),
  message: z.string().min(20, '20 caractères minimum'),
});
type Contact = z.infer<typeof contactSchema>;
export function ContactPage() {
  useSeo('Contact — 3N Services', 'Contactez l’équipe 3N Services.');
  const {
    register,
    formState: { errors },
  } = useForm<Contact>({ resolver: zodResolver(contactSchema) });
  return (
    <Content title="Comment pouvons-nous vous aider ?" eyebrow="Contact">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        <aside className="card h-fit">
          <h2 className="font-bold">Contacter 3N Services</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Aucun endpoint de contact n’est encore disponible. Le formulaire est préparé mais son
            envoi restera désactivé jusqu’à la mise en place de <code>POST /api/contact/</code>.
          </p>
        </aside>
        <form className="card grid gap-4 sm:grid-cols-2">
          {(
            [
              ['name', 'Nom'],
              ['email', 'E-mail'],
              ['phone', 'Téléphone (facultatif)'],
              ['subject', 'Sujet'],
            ] as const
          ).map(([n, l]) => (
            <label className="label" key={n}>
              {l}
              <input className="field mt-1" {...register(n)} />
              <small className="text-red-600">{errors[n]?.message}</small>
            </label>
          ))}
          <label className="label sm:col-span-2">
            Message
            <textarea className="field mt-1 min-h-36" {...register('message')} />
            <small className="text-red-600">{errors.message?.message}</small>
          </label>
          <button className="btn-primary sm:col-span-2" disabled>
            Envoi indisponible — endpoint requis
          </button>
        </form>
      </div>
    </Content>
  );
}
const faqs = [
  [
    'Réservation',
    'Comment réserver un véhicule ?',
    'Connectez-vous avec un compte CLIENT, choisissez un véhicule disponible puis renseignez vos dates.',
  ],
  [
    'Disponibilité',
    'Comment la disponibilité est-elle vérifiée ?',
    'Le serveur contrôle les réservations qui se chevauchent avant toute confirmation.',
  ],
  [
    'Annulation',
    'Puis-je annuler ?',
    'Une réservation en attente peut être annulée par son client. Les autres statuts nécessitent une intervention autorisée.',
  ],
  [
    'Avis',
    'Qui peut publier un avis ?',
    'Seul le client d’une réservation terminée et sans avis existant peut en publier un.',
  ],
  [
    'Agences',
    'Comment gérer une flotte ?',
    'Créez un compte AGENCY. Une agence ne peut gérer que ses propres véhicules.',
  ],
  [
    'Sécurité',
    'Comment mes données sont-elles protégées ?',
    'Les accès sont contrôlés par JWT et par des permissions serveur liées au rôle.',
  ],
];
export function FaqPage() {
  useSeo(
    'FAQ — 3N Services',
    'Réponses aux questions fréquentes sur la réservation et la location.',
  );
  return (
    <Content title="Questions fréquentes" eyebrow="Centre d’aide">
      <div className="mx-auto max-w-3xl divide-y rounded-2xl border bg-white px-6 dark:bg-slate-900">
        {faqs.map(([cat, q, a]) => (
          <details className="group py-5" key={q}>
            <summary className="cursor-pointer list-none font-semibold">
              <span className="mr-3 text-xs uppercase text-brand-600">{cat}</span>
              {q}
            </summary>
            <p className="mt-3 text-sm leading-6 text-slate-500">{a}</p>
          </details>
        ))}
      </div>
    </Content>
  );
}
export function TermsPage() {
  return (
    <Legal
      title="Conditions d’utilisation"
      intro="Modèle informatif à faire valider par un professionnel du droit avant toute mise en production."
      sections={[
        [
          'Utilisation de la plateforme',
          'L’utilisateur fournit des informations exactes, protège ses identifiants et respecte les droits des autres utilisateurs.',
        ],
        [
          'Réservations et paiements',
          'Les disponibilités, montants et statuts sont enregistrés par la plateforme. Les conditions commerciales finales relèvent également de l’agence concernée.',
        ],
        [
          'Obligations du client',
          'Le client respecte les dates, les conditions de remise du véhicule et les règles communiquées par l’agence.',
        ],
        [
          'Obligations des agences',
          'Les agences maintiennent des informations exactes sur leurs véhicules, leurs prix et leur disponibilité.',
        ],
        [
          'Annulation et fermeture',
          'Les possibilités dépendent du statut de la réservation. Un compte peut être suspendu en cas d’abus ou de non-respect des conditions.',
        ],
        [
          'Limitations',
          'La disponibilité technique et les services externes ne peuvent être garantis sans interruption.',
        ],
      ]}
    />
  );
}
export function PrivacyPage() {
  return (
    <Legal
      title="Politique de confidentialité"
      intro="Modèle de politique à adapter aux obligations légales applicables et à faire valider avant publication définitive."
      sections={[
        [
          'Données collectées',
          'Identité, coordonnées, profil, réservations, références de paiement, avis, adresses IP et journaux d’activité. Les données de carte ne transitent pas par 3N Services.',
        ],
        [
          'Finalités',
          'Authentification, gestion des réservations, sécurité, assistance, administration et amélioration du service.',
        ],
        [
          'Conservation et sécurité',
          'Les durées doivent être définies selon les obligations applicables. Les accès sont limités par rôle et les actions sensibles sont journalisées.',
        ],
        [
          'Droits des utilisateurs',
          'Les procédures d’accès, rectification, opposition et suppression devront être précisées selon la juridiction.',
        ],
        [
          'Cookies et stockage local',
          'Le frontend utilise le stockage du navigateur pour la session JWT et les préférences de thème.',
        ],
        [
          'Contact',
          'Un canal dédié à la protection des données doit être configuré avant la mise en production.',
        ],
      ]}
    />
  );
}
export function AgenciesPage() {
  useSeo('Agences — 3N Services', 'Découvrez les agences partenaires de 3N Services.');
  return (
    <Content title="Agences partenaires" eyebrow="Professionnels">
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-7 text-amber-900">
        <Building2 size={30} />
        <h2 className="mt-4 text-xl font-bold">Annuaire bientôt disponible</h2>
        <p className="mt-2 text-sm leading-6">
          Le backend ne fournit pas d’endpoint public pour lister ou consulter les agences. L’API
          nécessaire est <code>GET /api/agencies/</code> et <code>GET /api/agencies/:id/</code>,
          avec nom, ville, flotte et moyenne des avis.
        </p>
      </div>
    </Content>
  );
}
function Legal({ title, intro, sections }: { title: string; intro: string; sections: string[][] }) {
  useSeo(`${title} — 3N Services`, intro);
  return (
    <Content title={title} eyebrow="Informations légales">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {intro}
        </div>
        <div className="mt-8 space-y-8">
          {sections.map(([h, p], i) => (
            <section key={h}>
              <h2 className="text-xl font-bold">
                {i + 1}. {h}
              </h2>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{p}</p>
            </section>
          ))}
        </div>
      </div>
    </Content>
  );
}
function Content({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-14">
      <header className="mb-12 max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-600">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">{title}</h1>
      </header>
      {children}
    </main>
  );
}
