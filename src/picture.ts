/**
 * The solved layout made whole: where every line goes, which sides several
 * ends share, and where each line's texts sit, worked out once after
 * placement. The renderer draws this and the findings measure it, so the two
 * read one plan and can't disagree about where a line or a text is.
 *
 * Each part is worked out the first time it is read rather than up front, and
 * kept. That is not for speed: it keeps which mistake a file with several is
 * reported for. The renderer draws the boxes before it reads the lines, and
 * places a line's texts as it draws that line, so a box's mistake is still
 * reported ahead of a line's, and one line's text ahead of a later line's.
 */
import { assert, assertFound } from './assert.js';
import { placeLineTexts, type PlacedText } from './linetexts.js';
import { planSides, type Route, type SideEnds } from './lines.js';
import type { Layout, LayoutEdge } from './model.js';

export interface Picture {
  readonly layout: Layout;
  /** Every line's route, in the order written. */
  routes(): Map<LayoutEdge, Route>;
  /** One line's route. */
  route(edge: LayoutEdge): Route;
  /** Every side two or more ends share, for the findings to measure. */
  sides(): SideEnds[];
  /** One line's texts, placed on its route. */
  texts(edge: LayoutEdge): PlacedText[];
}

/** The picture of a solved layout, nothing worked out yet. */
export function pictureOf(layout: Layout): Picture {
  let planned: { routes: Map<LayoutEdge, Route>; sides: SideEnds[] } | undefined;
  const placed = new Map<LayoutEdge, PlacedText[]>();
  const plan = () => {
    if (planned === undefined) {
      planned = planSides(layout);
      for (const edge of layout.edges) {
        const route = assertFound(planned.routes.get(edge), 'every line in the layout is planned');
        assert(route.points.length > 0 && route.edge === edge, 'a planned line has a point and belongs to its line');
      }
      assert(planned.sides.every((side) => side.ends.length > 1), 'a shared side has two ends or more');
    }
    return planned;
  };
  const route = (edge: LayoutEdge) => assertFound(plan().routes.get(edge), 'a line asked for is one of the layout\'s');
  return {
    layout,
    routes: () => plan().routes,
    route,
    sides: () => plan().sides,
    texts(edge) {
      let texts = placed.get(edge);
      if (texts === undefined) {
        texts = placeLineTexts(edge, route(edge));
        assert(texts.length === edge.texts.length, 'every text on a line is placed, once');
        placed.set(edge, texts);
      }
      return texts;
    },
  };
}
