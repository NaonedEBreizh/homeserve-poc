"use client";

import { track } from "@/lib/analytics";
import { contactPourProjet } from "@/lib/contact";
import { useProjet } from "@/lib/store";

/**
 * Appel instrumenté (D34). Hors horaires, l'appel n'aboutirait pas : le
 * bouton bascule sur « Être rappelé » et les horaires sont affichés.
 */
export function BoutonAppel({
  source,
  step,
  avecMention = false,
}: {
  source: string;
  step: string;
  avecMention?: boolean;
}) {
  const { projet } = useProjet();
  const contact = contactPourProjet(projet);

  const classes =
    "inline-flex min-h-11 items-center gap-2 text-sm font-bold text-canard-500";

  return (
    <span className="inline-flex flex-col items-start gap-1">
      {contact.ouvert ? (
        <a
          href={`tel:${contact.numeroTel}`}
          onClick={() => track("call_click", { source, step })}
          className={classes}
        >
          {contact.libelle}
        </a>
      ) : (
        <a
          href="/rendez-vous?rappel=1"
          onClick={() => track("callback_requested", { source, step })}
          className={classes}
        >
          {contact.libelle}
        </a>
      )}

      {avecMention ? (
        <span className="text-xs text-neutre-500">{contact.mention}</span>
      ) : null}
    </span>
  );
}

/**
 * Horaires seuls, sur une ligne à part : dans l'en-tête, le message de
 * fermeture fait trois lignes et écraserait le mot-symbole s'il partageait
 * la rangée du lien.
 */
export function MentionHoraires() {
  const { projet } = useProjet();
  const contact = contactPourProjet(projet);

  return (
    <p className="px-5 pb-2 text-xs text-neutre-500">{contact.mention}</p>
  );
}
