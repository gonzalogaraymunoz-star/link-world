# LINK Ecosystem Theme · Acid Lime v1

LINK WORLD is the first app using the shared visual language that will later be propagated to connected LINK apps.

## Canonical palette

| Token | Value | Role |
| --- | --- | --- |
| `--link-cream` | `#f3f1e8` | warm ecosystem background |
| `--link-cream-2` | `#faf9f3` | secondary warm surface |
| `--link-paper` | `#fffef9` | cards and readable surfaces |
| `--link-charcoal` | `#171714` | structural dark cards |
| `--link-black` | `#0f0f0d` | primary text / navigation |
| `--link-stone` | `#77776f` | secondary text |
| `--link-line` | `#dedbd0` | borders |
| `--link-acid` | `#dfff00` | life / connection / action |
| `--link-acid-soft` | `#efffb3` | subtle interaction highlight |

## Accent semantics

Acid lime is not a decorative fill. It means one of:

- live / connected
- active relation
- current action
- primary CTA
- progress / validated signal
- selected graph path

Charcoal carries structure. Cream carries space. Gray carries secondary information.

Warnings and errors keep their semantic colors; the accent must not replace them.

## LINK WORLD coverage

`src/linkTheme.css` is loaded last and currently themes:

- global shell and navigation
- business home
- Territory
- Micelio
- Bitácora
- business/client/product fichas
- Director IA
- private bridge

The file is presentation-only. It does not change Supabase queries, RLS, authentication, graph logic, cron logic, or persistence.

## Extension rule for other LINK apps

Each connected app should import the same token names, then map its own components to those semantics. Do not copy component CSS blindly between apps.

The migration order is:

1. import tokens;
2. map background / paper / ink / border;
3. assign acid lime only to live/action/connection states;
4. preserve semantic warning/error colors;
5. verify mobile contrast and touch states;
6. verify the app still expresses its own function while belonging to the same family.
