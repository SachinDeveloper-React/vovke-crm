import { readAdminKey } from '@/src/lib/api';
import { EXAMPLE_SHEETS, type ExampleSheetKind } from '@/src/lib/example-sheets';

/**
 * The example sheet for an importer, built on request.
 *
 * Built rather than served from `public/`: a template checked in beside the
 * code drifts the first time a column is added, and the operator who finds
 * out is the one whose rows were skipped. This comes from the same column
 * list the importer reads, so the two cannot disagree.
 *
 * Behind the admin cookie like every other page here. There is nothing
 * private in a template — but an open download from the operator panel is
 * the kind of thing nobody means to leave open.
 */

const TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function GET(_request: Request, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  const sheet = EXAMPLE_SHEETS[kind as ExampleSheetKind];
  if (!sheet) {
    return new Response(`There is no “${kind}” example. The sheets are: ${Object.keys(EXAMPLE_SHEETS).join(', ')}.`, {
      status: 404,
    });
  }
  if (!(await readAdminKey())) return new Response('Not signed in.', { status: 401 });

  const body = await sheet.build();
  return new Response(body, {
    headers: {
      'content-type': TYPE,
      'content-disposition': `attachment; filename="${sheet.filename}"`,
      'cache-control': 'no-store',
    },
  });
}
