/** The scroll geometry of a horizontal scroller. */
export interface ScrollBox {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

/** Whether content is hidden before or after the visible part of a horizontal scroller. */
export interface ScrollEdges {
  before: boolean;
  after: boolean;
}

/** Which sides of a horizontal scroller hide content, with a pixel of slack for subpixel widths. */
export function scrollEdges({ scrollLeft, scrollWidth, clientWidth }: ScrollBox): ScrollEdges {
  return { before: scrollLeft > 1, after: scrollLeft + clientWidth < scrollWidth - 1 };
}
