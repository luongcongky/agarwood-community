import TiptapImage from "@tiptap/extension-image"

/**
 * Custom Image extension for TipTap with width + alignment attributes.
 * Selectable + draggable so users can click images to edit them.
 */
export const ResizableImage = TiptapImage.extend({
  // Make images selectable by clicking
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) =>
          element.getAttribute("data-width") ||
          element.style?.width ||
          "100%",
        renderHTML: (attributes) => ({
          "data-width": attributes.width,
          style: `width: ${attributes.width}`,
        }),
      },
      textAlign: {
        default: "center",
        parseHTML: (element) =>
          element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => {
          const align = attributes.textAlign
          const w = attributes.width || "100%"
          return {
            "data-align": align,
            style: [
              `width: ${w}`,
              "display: block",
              `margin-left: ${align === "center" || align === "right" ? "auto" : "0"}`,
              `margin-right: ${align === "center" || align === "left" ? "auto" : "0"}`,
              "cursor: pointer",
            ].join("; "),
          }
        },
      },
    }
  },
})
