import React, { useEffect, useRef, useState, useCallback } from "react";

import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

import {
  MousePointer2,
  Type,
  Image as ImageIcon,
  Highlighter,
  Pencil,
  Square,
  Minus,
  Eraser,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Upload,
  FilePenLine,
  X,
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  Underline,
} from "lucide-react";

// ============================================================
// EDIT PDF COMPONENT
// ============================================================

export default function EditPdf() {
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const viewportRef = useRef(null);

  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  const [pages, setPages] = useState({});
  const [elements, setElements] = useState([]);

  const [tool, setTool] = useState("select");
  const [selectedId, setSelectedId] = useState(null);

  const [drawColor, setDrawColor] = useState("#ff5c0a");

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dragging, setDragging] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);

  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateViewportSize = () => {
      if (!viewportRef.current) {
        setViewportSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        return;
      }

      setViewportSize({
        width: viewportRef.current.clientWidth,
        height: viewportRef.current.clientHeight,
      });
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);

    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  // ------------------------------------------------------------
  // LOAD PDF
  // ------------------------------------------------------------

  const loadPdf = async (selectedFile) => {
    if (!selectedFile || selectedFile.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }

    try {
      setLoading(true);

      const buffer = await selectedFile.arrayBuffer();

      const loadedPdf = await pdfjsLib.getDocument({
        data: buffer.slice(0),
      }).promise;

      setFile({
        file: selectedFile,
        buffer,
      });

      setPdfDoc(loadedPdf);
      setNumPages(loadedPdf.numPages);
      setCurrentPage(1);
      setZoom(1);
      setPages({});
      setElements([]);
      setSelectedId(null);
      setHistory([]);
      setFuture([]);
    } catch (error) {
      console.error(error);
      alert("Could not open this PDF.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // FILE INPUT
  // ------------------------------------------------------------

  const handleFileInput = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      loadPdf(selectedFile);
    }
  };

  // ------------------------------------------------------------
  // DRAG & DROP
  // ------------------------------------------------------------

  const handleDrop = (event) => {
    event.preventDefault();

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      loadPdf(droppedFile);
    }
  };

  // ------------------------------------------------------------
  // RENDER PAGE
  // ------------------------------------------------------------

  const renderPage = useCallback(
    async (pageNumber) => {
      if (!pdfDoc) return;

      const page = await pdfDoc.getPage(pageNumber);

      const renderScale = 1.5;

      const viewport = page.getViewport({
        scale: renderScale,
      });

      const originalViewport = page.getViewport({
        scale: 1,
      });

      const canvas = document.createElement("canvas");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      setPages((previous) => ({
        ...previous,
        [pageNumber]: {
          widthPts: originalViewport.width,
          heightPts: originalViewport.height,

          cssW: viewport.width,
          cssH: viewport.height,

          canvas,
          drawings: previous[pageNumber]?.drawings || [],

          renderScale,

          textUnlocked: previous[pageNumber]?.textUnlocked || false,
        },
      }));
    },
    [pdfDoc],
  );

  // ------------------------------------------------------------
  // RENDER CURRENT PAGE
  // ------------------------------------------------------------

  useEffect(() => {
    if (!pdfDoc) return;

    if (!pages[currentPage]) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, pages, renderPage]);

  // ------------------------------------------------------------
  // DRAWINGS CANVAS
  // ------------------------------------------------------------

  const drawShape = useCallback((ctx, drawing) => {
    if (!drawing) return;

    ctx.save();

    if (drawing.type === "rect") {
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = 3;

      ctx.strokeRect(drawing.x, drawing.y, drawing.w, drawing.h);
    }

    if (drawing.type === "highlight") {
      ctx.fillStyle = drawing.color;
      ctx.globalAlpha = 0.35;

      ctx.fillRect(drawing.x, drawing.y, drawing.w, drawing.h);
    }

    if (drawing.type === "whiteout") {
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 1;

      ctx.fillRect(drawing.x, drawing.y, drawing.w, drawing.h);
    }

    if (drawing.type === "line") {
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = 3;

      ctx.beginPath();

      ctx.moveTo(drawing.x1, drawing.y1);

      ctx.lineTo(drawing.x2, drawing.y2);

      ctx.stroke();
    }

    if (drawing.type === "pen") {
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      ctx.beginPath();

      drawing.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });

      ctx.stroke();
    }

    ctx.restore();
  }, []);

  // ------------------------------------------------------------
  // REDRAW DRAWINGS
  // ------------------------------------------------------------

  const redrawDrawings = useCallback(
    (canvas, drawingList) => {
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawingList?.forEach((drawing) => {
        drawShape(ctx, drawing);
      });
    },
    [drawShape],
  );

  // ------------------------------------------------------------
  // TEXT EXTRACTION
  // ------------------------------------------------------------

  const unlockText = async () => {
    if (!pdfDoc || !pages[currentPage]) return;

    const pg = pages[currentPage];

    try {
      const page = await pdfDoc.getPage(currentPage);

      const viewport = page.getViewport({
        scale: pg.renderScale,
      });

      const textContent = await page.getTextContent();

      const lines = [];

      let currentLine = null;

      for (const item of textContent.items) {
        if (!item.str || !item.str.trim()) {
          if (item.hasEOL) {
            currentLine = null;
          }

          continue;
        }

        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);

        const x = tx[4];
        const yBase = tx[5];

        const fontHeight =
          Math.hypot(tx[2], tx[3]) || item.height * pg.renderScale || 10;

        const width = item.width * pg.renderScale;

        if (
          currentLine &&
          Math.abs(currentLine.yBase - yBase) < Math.max(2, fontHeight * 0.35)
        ) {
          const gap = x - currentLine.maxX;

          if (gap > Math.max(5, fontHeight * 0.9)) {
            currentLine = {
              yBase,
              minX: x,
              maxX: x + width,
              text: item.str,
              fontHeight,
            };

            lines.push(currentLine);
          } else {
            currentLine.text +=
              gap > fontHeight * 0.2 && !currentLine.text.endsWith(" ")
                ? " " + item.str
                : item.str;

            currentLine.maxX = Math.max(currentLine.maxX, x + width);
            currentLine.minX = Math.min(currentLine.minX, x);
            currentLine.fontHeight = Math.max(
              currentLine.fontHeight,
              fontHeight,
            );
          }
        } else {
          currentLine = {
            yBase,
            minX: x,
            maxX: x + width,
            text: item.str,
            fontHeight,
          };

          lines.push(currentLine);
        }

        if (item.hasEOL) {
          currentLine = null;
        }
      }

      const newElements = [];
      const newDrawings = [...(pg.drawings || [])];

      lines.forEach((line, index) => {
        if (!line.text.trim()) return;

        const h = line.fontHeight * 1.25;

        const top = line.yBase - line.fontHeight * 0.83;

        const w = line.maxX - line.minX + 6;

        newDrawings.push({
          type: "whiteout",
          x: line.minX - 2,
          y: top - 2,
          w,
          h: h + 4,
          color: "#ffffff",
          extractedMask: true,
        });

        newElements.push({
          id:
            "ex-" +
            Date.now() +
            "-" +
            index +
            "-" +
            Math.random().toString(36).slice(2, 7),

          page: currentPage,

          type: "text",

          extracted: true,

          x: line.minX,
          y: top,

          width: w,
          height: Math.max(24, h + 8),

          text: line.text,

          fontSize: Math.max(8, line.fontHeight * 0.92),

          bold: false,
          italic: false,
          underline: false,

          color: "#111111",
        });
      });

      setElements((prev) => [
        ...prev.filter((el) => !(el.page === currentPage && el.extracted)),
        ...newElements,
      ]);

      setPages((prev) => ({
        ...prev,

        [currentPage]: {
          ...prev[currentPage],

          drawings: newDrawings,

          textUnlocked: true,
        },
      }));

      saveHistory(
        [
          ...elements.filter(
            (el) => !(el.page === currentPage && el.extracted),
          ),
          ...newElements,
        ],
        {
          ...pages,
          [currentPage]: {
            ...pg,
            drawings: newDrawings,
            textUnlocked: true,
          },
        },
      );
    } catch (error) {
      console.error(error);
      alert("Could not unlock the PDF text.");
    }
  };

  // ------------------------------------------------------------
  // HISTORY
  // ------------------------------------------------------------

  const createSnapshot = (currentElements = elements, currentPages = pages) => {
    return {
      elements: JSON.parse(JSON.stringify(currentElements)),

      drawings: JSON.parse(
        JSON.stringify(
          Object.fromEntries(
            Object.entries(currentPages).map(([key, value]) => [
              key,
              value.drawings || [],
            ]),
          ),
        ),
      ),
    };
  };

  const saveHistory = (currentElements = elements, currentPages = pages) => {
    const snapshot = createSnapshot(currentElements, currentPages);

    setHistory((prev) => {
      const next = [...prev, snapshot];

      if (next.length > 40) {
        next.shift();
      }

      return next;
    });

    setFuture([]);
  };

  const undo = () => {
    if (history.length < 2) return;

    const current = history[history.length - 1];

    const previous = history[history.length - 2];

    setFuture((prev) => [...prev, current]);

    restoreSnapshot(previous);

    setHistory((prev) => prev.slice(0, -1));
  };

  const redo = () => {
    if (!future.length) return;

    const snapshot = future[future.length - 1];

    setHistory((prev) => [...prev, snapshot]);

    restoreSnapshot(snapshot);

    setFuture((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (!isCtrlOrMeta) return;

      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      }

      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history.length, future.length, undo, redo]);

  const restoreSnapshot = (snapshot) => {
    setElements(JSON.parse(JSON.stringify(snapshot.elements)));

    setPages((prev) => {
      const next = { ...prev };

      Object.entries(snapshot.drawings).forEach(([pageNumber, drawings]) => {
        if (next[pageNumber]) {
          next[pageNumber] = {
            ...next[pageNumber],
            drawings,
          };
        }
      });

      return next;
    });

    setSelectedId(null);
  };

  // ------------------------------------------------------------
  // ADD TEXT
  // ------------------------------------------------------------

  const addText = (x, y) => {
    const newElement = {
      id: "text-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),

      page: currentPage,

      type: "text",

      x,
      y,

      width: 220,
      height: 44,

      text: "Type here…",

      fontSize: 18,

      bold: false,
      italic: false,
      underline: false,

      color: "#111111",
    };

    const updatedElements = [...elements, newElement];

    setElements(updatedElements);

    setSelectedId(newElement.id);

    saveHistory(updatedElements, pages);
  };

  // ------------------------------------------------------------
  // ADD IMAGE
  // ------------------------------------------------------------

  const addImage = (x, y) => {
    setPendingImage({
      page: currentPage,
      x,
      y,
    });

    imageInputRef.current?.click();
  };

  const handleImageInput = (event) => {
    const selectedImage = event.target.files?.[0];

    if (!selectedImage || !pendingImage) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const width = Math.min(220, image.width);

        const height = width * (image.height / image.width);

        const newElement = {
          id:
            "image-" +
            Date.now() +
            "-" +
            Math.random().toString(36).slice(2, 7),

          page: pendingImage.page,

          type: "image",

          x: pendingImage.x - width / 2,

          y: pendingImage.y - height / 2,

          width,
          height,

          dataUrl: reader.result,
        };

        const updated = [...elements, newElement];

        setElements(updated);

        setSelectedId(newElement.id);

        saveHistory(updated, pages);

        setPendingImage(null);

        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(selectedImage);
  };

  // ------------------------------------------------------------
  // DRAWING
  // ------------------------------------------------------------

  const startDrawing = (event) => {
    if (event.target.dataset?.element) {
      return;
    }

    if (
      ![
        "rect",
        "line",
        "highlight",
        "whiteout",
        "pen",
        "text",
        "image",
      ].includes(tool)
    ) {
      return;
    }

    const stage = event.currentTarget;

    const rect = stage.getBoundingClientRect();

    const pg = pages[currentPage];

    if (!pg) return;

    const scaleX = pg.cssW / rect.width;

    const scaleY = pg.cssH / rect.height;

    const x = (event.clientX - rect.left) * scaleX;

    const y = (event.clientY - rect.top) * scaleY;

    if (tool === "text") {
      addText(x, y);

      setTool("select");

      return;
    }

    if (tool === "image") {
      addImage(x, y);

      setTool("select");

      return;
    }

    if (tool === "pen") {
      setDragging({
        type: "pen",
        points: [{ x, y }],
        color: drawColor,
      });

      return;
    }

    setDragging({
      type: "shape",
      shapeType: tool,

      x0: x,
      y0: y,

      color: drawColor,
    });
  };

  const continueDrawing = (event) => {
    if (!dragging) return;

    const stage = event.currentTarget;

    const rect = stage.getBoundingClientRect();

    const pg = pages[currentPage];

    const scaleX = pg.cssW / rect.width;

    const scaleY = pg.cssH / rect.height;

    const x = (event.clientX - rect.left) * scaleX;

    const y = (event.clientY - rect.top) * scaleY;

    if (dragging.type === "pen") {
      setDragging((prev) => ({
        ...prev,

        points: [...prev.points, { x, y }],
      }));

      return;
    }

    setDragging((prev) => ({
      ...prev,

      currentX: x,
      currentY: y,
    }));
  };

  const finishDrawing = (event) => {
    if (!dragging) return;

    const stage = event.currentTarget;

    const rect = stage.getBoundingClientRect();

    const pg = pages[currentPage];

    const scaleX = pg.cssW / rect.width;

    const scaleY = pg.cssH / rect.height;

    const x = (event.clientX - rect.left) * scaleX;

    const y = (event.clientY - rect.top) * scaleY;

    let drawing = null;

    if (dragging.type === "pen") {
      if (dragging.points.length > 1) {
        drawing = {
          type: "pen",

          points: [...dragging.points, { x, y }],

          color: dragging.color,
        };
      }
    } else {
      if (dragging.shapeType === "line") {
        drawing = {
          type: "line",

          x1: dragging.x0,
          y1: dragging.y0,

          x2: x,
          y2: y,

          color: dragging.color,
        };
      } else {
        const drawX = Math.min(dragging.x0, x);

        const drawY = Math.min(dragging.y0, y);

        const width = Math.abs(x - dragging.x0);

        const height = Math.abs(y - dragging.y0);

        if (width > 2 && height > 2) {
          drawing = {
            type: dragging.shapeType,

            x: drawX,
            y: drawY,

            w: width,
            h: height,

            color: dragging.color,
          };
        }
      }
    }

    if (drawing) {
      const updatedPages = {
        ...pages,

        [currentPage]: {
          ...pages[currentPage],

          drawings: [...(pages[currentPage].drawings || []), drawing],
        },
      };

      setPages(updatedPages);

      saveHistory(elements, updatedPages);
    }

    setDragging(null);
  };

  // ------------------------------------------------------------
  // SELECT ELEMENT
  // ------------------------------------------------------------

  const selectElement = (event, id) => {
    event.stopPropagation();

    setSelectedId(id);
  };

  // ------------------------------------------------------------
  // DELETE ELEMENT
  // ------------------------------------------------------------

  const deleteSelected = () => {
    if (!selectedId) return;

    const target = elements.find((element) => element.id === selectedId);

    if (!target) return;

    const updated = elements.filter((element) => element.id !== selectedId);

    const currentPageDrawings = [...(pages[currentPage]?.drawings || [])];

    if (target.type === "text" && target.extracted) {
      currentPageDrawings.push({
        type: "whiteout",
        x: Math.max(0, target.x - 4),
        y: Math.max(0, target.y - 4),
        w: Math.max(target.width + 8, 18),
        h: Math.max((target.fontSize || 16) * 1.5 + 8, 20),
        color: "#ffffff",
      });
    }

    const updatedPages = {
      ...pages,
      [currentPage]: {
        ...pages[currentPage],
        drawings: currentPageDrawings,
      },
    };

    setElements(updated);
    setPages(updatedPages);
    setSelectedId(null);

    saveHistory(updated, updatedPages);
  };

  // ------------------------------------------------------------
  // UPDATE ELEMENT
  // ------------------------------------------------------------

  const updateElement = (id, changes) => {
    setElements((prev) =>
      prev.map((element) =>
        element.id === id
          ? {
              ...element,
              ...changes,
            }
          : element,
      ),
    );
  };

  // ------------------------------------------------------------
  // DOWNLOAD
  // ------------------------------------------------------------

  const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = name;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);
  };

  // ------------------------------------------------------------
  // HEX → RGB
  // ------------------------------------------------------------

  const hexToRgb = (hex) => {
    const value = hex.replace("#", "");

    const number = parseInt(
      value.length === 3
        ? value
            .split("")
            .map((c) => c + c)
            .join("")
        : value,
      16,
    );

    return {
      r: ((number >> 16) & 255) / 255,

      g: ((number >> 8) & 255) / 255,

      b: (number & 255) / 255,
    };
  };

  // ------------------------------------------------------------
  // SAVE EDITED PDF
  // ------------------------------------------------------------

  const savePdf = async () => {
    if (!file) return;

    try {
      setSaving(true);

      const outputPdf = await PDFDocument.load(file.buffer.slice(0));

      const regular = await outputPdf.embedFont(StandardFonts.Helvetica);

      const bold = await outputPdf.embedFont(StandardFonts.HelveticaBold);

      const italic = await outputPdf.embedFont(StandardFonts.HelveticaOblique);

      const boldItalic = await outputPdf.embedFont(
        StandardFonts.HelveticaBoldOblique,
      );

      for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
        const pg = pages[pageNumber];

        if (!pg) continue;

        const pdfPage = outputPdf.getPage(pageNumber - 1);

        const scale = pg.widthPts / pg.cssW;

        // -----------------------
        // DRAWINGS
        // -----------------------

        for (const drawing of pg.drawings || []) {
          const color = hexToRgb(drawing.color || "#000000");

          if (drawing.type === "rect") {
            pdfPage.drawRectangle({
              x: drawing.x * scale,

              y: pg.heightPts - (drawing.y + drawing.h) * scale,

              width: drawing.w * scale,

              height: drawing.h * scale,

              borderColor: rgb(color.r, color.g, color.b),

              borderWidth: 1.5,
            });
          }

          if (drawing.type === "highlight") {
            pdfPage.drawRectangle({
              x: drawing.x * scale,

              y: pg.heightPts - (drawing.y + drawing.h) * scale,

              width: drawing.w * scale,

              height: drawing.h * scale,

              color: rgb(color.r, color.g, color.b),

              opacity: 0.35,
            });
          }

          if (drawing.type === "whiteout") {
            pdfPage.drawRectangle({
              x: drawing.x * scale,

              y: pg.heightPts - (drawing.y + drawing.h) * scale,

              width: drawing.w * scale,

              height: drawing.h * scale,

              color: rgb(1, 1, 1),

              opacity: 1,
            });
          }

          if (drawing.type === "line") {
            pdfPage.drawLine({
              start: {
                x: drawing.x1 * scale,

                y: pg.heightPts - drawing.y1 * scale,
              },

              end: {
                x: drawing.x2 * scale,

                y: pg.heightPts - drawing.y2 * scale,
              },

              thickness: 1.5,

              color: rgb(color.r, color.g, color.b),
            });
          }

          if (drawing.type === "pen") {
            for (let i = 1; i < drawing.points.length; i++) {
              const a = drawing.points[i - 1];

              const b = drawing.points[i];

              pdfPage.drawLine({
                start: {
                  x: a.x * scale,

                  y: pg.heightPts - a.y * scale,
                },

                end: {
                  x: b.x * scale,

                  y: pg.heightPts - b.y * scale,
                },

                thickness: 1.5,

                color: rgb(color.r, color.g, color.b),
              });
            }
          }
        }

        // -----------------------
        // TEXT + IMAGES
        // -----------------------

        const pageElements = elements.filter(
          (element) => element.page === pageNumber,
        );

        for (const element of pageElements) {
          if (element.type === "text") {
            const font =
              element.bold && element.italic
                ? boldItalic
                : element.bold
                  ? bold
                  : element.italic
                    ? italic
                    : regular;

            const color = hexToRgb(element.color);

            const size = element.fontSize * scale;

            const lines = element.text.split("\n");

            let y = pg.heightPts - element.y * scale - size;

            for (const line of lines) {
              pdfPage.drawText(line, {
                x: element.x * scale,

                y,

                size,

                font,

                color: rgb(color.r, color.g, color.b),
              });

              y -= size * 1.25;
            }
          }

          if (element.type === "image") {
            const isPng = element.dataUrl.startsWith("data:image/png");

            const base64 = element.dataUrl.split(",")[1];

            const bytes = Uint8Array.from(atob(base64), (char) =>
              char.charCodeAt(0),
            );

            const image = isPng
              ? await outputPdf.embedPng(bytes)
              : await outputPdf.embedJpg(bytes);

            pdfPage.drawImage(image, {
              x: element.x * scale,

              y: pg.heightPts - (element.y + element.height) * scale,

              width: element.width * scale,

              height: element.height * scale,
            });
          }
        }
      }

      const bytes = await outputPdf.save();

      const originalName = file.file.name.replace(/\.pdf$/i, "");

      downloadBlob(
        new Blob([bytes], {
          type: "application/pdf",
        }),
        `${originalName}-edited.pdf`,
      );
    } catch (error) {
      console.error(error);

      alert("Could not save the edited PDF: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  const currentPg = pages[currentPage];
  const isMobile = viewportSize.width > 0 && viewportSize.width < 640;
  const isCompact = viewportSize.width > 0 && viewportSize.width < 1030;

  const fitZoom = currentPg
    ? Math.max(
        0.35,
        Math.min(
          1.8,
          (viewportSize.width > 0
            ? Math.max(
                120,
                viewportSize.width - (isMobile ? 40 : isCompact ? 180 : 260),
              )
            : 900) / Math.max(120, currentPg.cssW),
        ),
      )
    : 1;

  const effectiveZoom = currentPg
    ? isCompact
      ? Math.min(zoom, fitZoom)
      : zoom
    : zoom;

  const currentElements = elements.filter(
    (element) => element.page === currentPage,
  );

  const selectedTextElement =
    selectedId &&
    elements.find(
      (element) => element.id === selectedId && element.type === "text",
    );

  const toolCursor = {
    select: "default",
    text: "text",
    image: "copy",
    highlight: "crosshair",
    pen: "crosshair",
    rect: "crosshair",
    line: "crosshair",
    whiteout: "crosshair",
  };

  return (
    <section
      id="edit"
      className="relative min-h-screen overflow-hidden bg-[#0d0908] px-4 py-16 text-white sm:px-6 lg:px-8"
    >
      {/* Background glow */}

      <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[#ff5c0a]/5 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* ======================================================
            SECTION HEADER
        ====================================================== */}

        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-flame-500/30 bg-flame-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-flame-400">
            <FilePenLine size={14} />
            EDIT PDF
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Mark it up like a <span className="text-[#ff5c0a]">document</span>,
            not a picture.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#9ca3af] sm:text-base">
            Load a PDF and edit it directly in your browser. Add text, images,
            shapes, highlights and freehand notes, then save a new PDF with your
            changes.
          </p>
        </div>

        {/* ======================================================
            UPLOAD
        ====================================================== */}

        {!pdfDoc && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="group mx-auto max-w-3xl cursor-pointer rounded-2xl border border-dashed border-[#3a2a25] bg-[#111010] p-8 transition hover:border-[#ff5c0a]/60 hover:bg-[#14110f] sm:p-12"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff5c0a]/10 text-[#ff5c0a] transition group-hover:scale-105">
              {loading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#ff5c0a] border-t-transparent" />
              ) : (
                <Upload size={28} />
              )}
            </div>

            <h3 className="mt-5 text-center text-xl font-bold">
              {loading ? "Opening PDF..." : "Drop a PDF here to start editing"}
            </h3>

            <p className="mt-2 text-center text-sm text-[#737373]">
              One document at a time — this becomes your live working copy.
            </p>

            <div className="mt-6 text-center">
              <span className="inline-flex rounded-lg bg-[#ff5c0a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ff6a1a]">
                Choose PDF
              </span>
            </div>
          </div>
        )}

        {/* ======================================================
            EDITOR
        ====================================================== */}

        {pdfDoc && (
          <div className="overflow-hidden rounded-2xl border border-[#272323] bg-[#111010] shadow-2xl">
            {/* ==================================================
                TOP BAR
            ================================================== */}

            <div className="flex flex-wrap items-center gap-2 border-b border-[#272323] bg-[#0d0d0d] p-3">
              {/* MOBILE TOOLS */}

              <button
                onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                className="rounded-lg border border-[#302724] bg-[#171313] p-2 text-gray-300 hover:border-[#ff5c0a]/40 hover:text-[#ff5c0a] lg:hidden"
              >
                <FilePenLine size={18} />
              </button>

              {/* DESKTOP TOOL GROUP */}

              <div
                className={`${
                  mobileToolsOpen ? "flex" : "hidden"
                } w-full flex-wrap gap-2 lg:flex lg:w-auto`}
              >
                <ToolButton
                  active={tool === "select"}
                  onClick={() => setTool("select")}
                  title="Select"
                >
                  <MousePointer2 size={17} />
                </ToolButton>

                <ToolButton
                  active={tool === "text"}
                  onClick={() => setTool("text")}
                  title="Add Text"
                >
                  <Type size={17} />
                </ToolButton>

                <ToolButton
                  active={tool === "image"}
                  onClick={() => setTool("image")}
                  title="Insert Image"
                >
                  <ImageIcon size={17} />
                </ToolButton>

                <ToolButton
                  active={tool === "highlight"}
                  onClick={() => setTool("highlight")}
                  title="Highlight"
                >
                  <Highlighter size={17} />
                </ToolButton>

                <ToolButton
                  active={tool === "pen"}
                  onClick={() => setTool("pen")}
                  title="Pen"
                >
                  <Pencil size={17} />
                </ToolButton>

                <ToolButton
                  active={tool === "rect"}
                  onClick={() => setTool("rect")}
                  title="Rectangle"
                >
                  <Square size={17} />
                </ToolButton>

                <ToolButton
                  active={tool === "line"}
                  onClick={() => setTool("line")}
                  title="Line"
                >
                  <Minus size={17} />
                </ToolButton>

                <ToolButton
                  active={tool === "whiteout"}
                  onClick={() => setTool("whiteout")}
                  title="Whiteout"
                >
                  <Eraser size={17} />
                </ToolButton>
              </div>

              {/* COLOR */}

              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-[10px] uppercase tracking-widest text-[#666] sm:block">
                  Color
                </span>

                <input
                  type="color"
                  value={drawColor}
                  onChange={(e) => setDrawColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-[#302724] bg-transparent"
                />
              </div>

              {/* ZOOM */}

              <div className="flex items-center gap-1 rounded-lg border border-[#272323] bg-[#151313] p-1">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-[#211916] hover:text-white"
                >
                  <ZoomOut size={16} />
                </button>

                <span className="min-w-[45px] text-center text-xs text-gray-400">
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-[#211916] hover:text-white"
                >
                  <ZoomIn size={16} />
                </button>
              </div>

              {/* UNDO REDO */}

              <div className="flex gap-1">
                <IconButton
                  onClick={undo}
                  disabled={history.length < 2}
                  title="Undo"
                >
                  <Undo2 size={16} />
                </IconButton>

                <IconButton
                  onClick={redo}
                  disabled={!future.length}
                  title="Redo"
                >
                  <Redo2 size={16} />
                </IconButton>

                <IconButton
                  onClick={deleteSelected}
                  disabled={!selectedId}
                  title="Delete selected"
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>

              {/* SAVE */}

              <button
                onClick={savePdf}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#ff5c0a] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#ff6a1a] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                <Download size={16} />

                {saving ? "Saving..." : "Save Edited PDF"}
              </button>
            </div>

            {/* ==================================================
                SECONDARY BAR
            ================================================== */}

            <div className="flex flex-wrap items-center gap-2 border-b border-[#272323] bg-[#0d0d0d] px-3 py-2">
              <button
                onClick={unlockText}
                className="rounded-lg border border-[#302724] bg-[#171313] px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-[#ff5c0a]/40 hover:text-[#ff5c0a]"
              >
                <span className="flex items-center gap-2">
                  <Type size={14} />
                  Unlock Text
                </span>
              </button>

              {selectedTextElement && (
                <div className="ml-2 flex items-center gap-1 rounded-lg border border-[#302724] bg-[#171313] p-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateElement(selectedTextElement.id, {
                        bold: !selectedTextElement.bold,
                      })
                    }
                    className={`h-8 min-w-[34px] rounded-md px-2 text-sm font-bold ${selectedTextElement.bold ? "bg-[#ff5c0a]/20 text-[#ff5c0a]" : "text-gray-300"}`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateElement(selectedTextElement.id, {
                        italic: !selectedTextElement.italic,
                      })
                    }
                    className={`h-8 min-w-[34px] rounded-md px-2 text-sm italic ${selectedTextElement.italic ? "bg-[#ff5c0a]/20 text-[#ff5c0a]" : "text-gray-300"}`}
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateElement(selectedTextElement.id, {
                        underline: !selectedTextElement.underline,
                      })
                    }
                    className={`h-8 min-w-[34px] rounded-md px-2 text-sm underline ${selectedTextElement.underline ? "bg-[#ff5c0a]/20 text-[#ff5c0a]" : "text-gray-300"}`}
                  >
                    U
                  </button>
                  <input
                    type="color"
                    value={selectedTextElement.color || "#111111"}
                    onChange={(event) =>
                      updateElement(selectedTextElement.id, {
                        color: event.target.value,
                      })
                    }
                    className="h-8 w-8 cursor-pointer rounded border border-[#302724] bg-transparent"
                    aria-label="Text color"
                  />
                </div>
              )}

              <div className="ml-auto text-xs text-[#666]">
                Page {currentPage} of {numPages}
              </div>
            </div>

            {/* ==================================================
                EDITOR BODY
            ================================================== */}

            <div
              className={`flex h-[70vh] min-h-[360px] min-w-0 ${
                isMobile ? "flex-col" : "flex-row"
              }`}
            >
              {isMobile && (
                <div className="order-last w-full shrink-0 overflow-x-auto overflow-y-hidden border-t border-[#272323] bg-[#0b0b0b] p-2">
                  <div className="flex min-w-max gap-2">
                    {Array.from(
                      {
                        length: numPages,
                      },
                      (_, index) => {
                        const pageNumber = index + 1;

                        return (
                          <Thumbnail
                            key={pageNumber}
                            pdfDoc={pdfDoc}
                            pageNumber={pageNumber}
                            active={pageNumber === currentPage}
                            onClick={() => setCurrentPage(pageNumber)}
                          />
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {!isMobile && (
                <div className="w-[70px] shrink-0 overflow-y-auto border-r border-[#272323] bg-[#0b0b0b] p-2 sm:w-[90px] lg:w-[120px] xl:w-[140px]">
                  {Array.from(
                    {
                      length: numPages,
                    },
                    (_, index) => {
                      const pageNumber = index + 1;

                      return (
                        <Thumbnail
                          key={pageNumber}
                          pdfDoc={pdfDoc}
                          pageNumber={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => setCurrentPage(pageNumber)}
                        />
                      );
                    },
                  )}
                </div>
              )}

              {/* PAGE VIEWPORT */}

              <div
                ref={viewportRef}
                className="relative min-w-0 flex-1 overflow-auto bg-[#080808] p-2 sm:p-4 md:p-8"
              >
                {currentPg && (
                  <div className="flex min-h-full min-w-full items-start justify-center">
                    <div
                      className="relative shrink-0 shadow-[0_20px_60px_rgba(0,0,0,.5)]"
                      style={{
                        width: currentPg.cssW * effectiveZoom,
                        maxWidth: "100%",
                        height: currentPg.cssH * effectiveZoom,
                        maxHeight: "100%",
                        cursor: toolCursor[tool] || "default",
                      }}
                      onMouseDown={startDrawing}
                      onMouseMove={continueDrawing}
                      onMouseUp={finishDrawing}
                      onMouseLeave={dragging ? finishDrawing : undefined}
                    >
                      {/* PDF CANVAS */}

                      <canvas
                        ref={(node) => {
                          if (node && currentPg.canvas) {
                            const ctx = node.getContext("2d");

                            node.width = currentPg.canvas.width;

                            node.height = currentPg.canvas.height;

                            ctx.drawImage(currentPg.canvas, 0, 0);
                          }
                        }}
                        className="absolute inset-0 h-full w-full bg-white"
                      />

                      {/* DRAWING LAYER */}

                      <canvas
                        ref={(node) => {
                          if (!node) return;

                          node.width = currentPg.cssW;

                          node.height = currentPg.cssH;

                          redrawDrawings(node, currentPg.drawings);

                          // Preview active drawing
                          if (dragging) {
                            const ctx = node.getContext("2d");

                            if (dragging.type === "pen") {
                              drawShape(ctx, {
                                type: "pen",
                                points: dragging.points,
                                color: dragging.color,
                              });
                            }

                            if (dragging.type === "shape") {
                              const endX = dragging.currentX ?? dragging.x0;

                              const endY = dragging.currentY ?? dragging.y0;

                              if (dragging.shapeType === "line") {
                                drawShape(ctx, {
                                  type: "line",

                                  x1: dragging.x0,
                                  y1: dragging.y0,

                                  x2: endX,
                                  y2: endY,

                                  color: dragging.color,
                                });
                              } else {
                                drawShape(ctx, {
                                  type: dragging.shapeType,

                                  x: Math.min(dragging.x0, endX),

                                  y: Math.min(dragging.y0, endY),

                                  w: Math.abs(endX - dragging.x0),

                                  h: Math.abs(endY - dragging.y0),

                                  color: dragging.color,
                                });
                              }
                            }
                          }
                        }}
                        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
                      />

                      {/* ELEMENTS */}

                      <div className="absolute inset-0 z-20">
                        {currentElements.map((element) => (
                          <EditorElement
                            key={element.id}
                            element={element}
                            selected={selectedId === element.id}
                            zoom={effectiveZoom}
                            onSelect={selectElement}
                            onChange={updateElement}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ==================================================
                FOOTER HINT
            ================================================== */}

            <div className="border-t border-[#272323] bg-[#0d0d0d] px-4 py-3 text-xs leading-5 text-[#666]">
              <span className="text-[#ff5c0a]">Tip:</span> Text tool adds
              editable text. Image and shape tools use click-drag placement.
              Everything stays in your browser until you save the edited PDF.
            </div>
          </div>
        )}
      </div>

      {/* IMAGE INPUT */}

      <input
        ref={imageInputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={handleImageInput}
        className="hidden"
      />
    </section>
  );
}

// ============================================================
// TOOL BUTTON
// ============================================================

function ToolButton({ children, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        flex h-9 w-9 items-center justify-center
        rounded-lg border transition
        ${
          active
            ? "border-[#ff5c0a]/60 bg-[#ff5c0a]/15 text-[#ff5c0a]"
            : "border-[#302724] bg-[#171313] text-gray-400 hover:border-[#ff5c0a]/40 hover:text-white"
        }
      `}
    >
      {children}
    </button>
  );
}

// ============================================================
// ICON BUTTON
// ============================================================

function IconButton({ children, onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#302724] bg-[#171313] text-gray-400 transition hover:border-[#ff5c0a]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

// ============================================================
// THUMBNAIL
// ============================================================

function Thumbnail({ pdfDoc, pageNumber, active, onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);

        const viewport = page.getViewport({
          scale: 0.2,
        });

        const canvas = canvasRef.current;

        if (!canvas) return;

        canvas.width = viewport.width;

        canvas.height = viewport.height;

        await page.render({
          canvasContext: canvas.getContext("2d"),

          viewport,
        }).promise;
      } catch (error) {
        if (!cancelled) {
          console.error(error);
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  return (
    <button
      onClick={onClick}
      className={`mb-3 w-full rounded-lg border p-1 transition ${
        active
          ? "border-[#ff5c0a] bg-[#ff5c0a]/10"
          : "border-[#272323] bg-[#111010] hover:border-[#ff5c0a]/40"
      }`}
    >
      <canvas ref={canvasRef} className="mx-auto block max-w-full" />

      <span
        className={`mt-1 block text-[9px] ${
          active ? "text-[#ff5c0a]" : "text-[#666]"
        }`}
      >
        {pageNumber}
      </span>
    </button>
  );
}

// ============================================================
// EDITOR ELEMENT
// ============================================================

function EditorElement({ element, selected, zoom, onSelect, onChange }) {
  const elementRef = useRef(null);

  const dragRef = useRef(null);

  const resizeRef = useRef(null);

  // ----------------------------------------------------------
  // DRAG
  // ----------------------------------------------------------

  const startDrag = (event) => {
    if (event.target.dataset?.resize) {
      return;
    }

    if (event.target.closest && event.target.closest("textarea")) {
      event.stopPropagation();
      onSelect(event, element.id);
      return;
    }

    event.stopPropagation();

    onSelect(event, element.id);

    dragRef.current = {
      startX: event.clientX,

      startY: event.clientY,

      originalX: element.x,

      originalY: element.y,
    };

    const handleMove = (moveEvent) => {
      if (!dragRef.current) return;

      const dx = (moveEvent.clientX - dragRef.current.startX) / zoom;

      const dy = (moveEvent.clientY - dragRef.current.startY) / zoom;

      onChange(element.id, {
        x: dragRef.current.originalX + dx,

        y: dragRef.current.originalY + dy,
      });
    };

    const handleUp = () => {
      dragRef.current = null;

      window.removeEventListener("mousemove", handleMove);

      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);

    window.addEventListener("mouseup", handleUp);
  };

  // ----------------------------------------------------------
  // RESIZE IMAGE
  // ----------------------------------------------------------

  const startResize = (event) => {
    event.stopPropagation();

    resizeRef.current = {
      startX: event.clientX,

      startY: event.clientY,

      originalWidth: element.width,

      originalHeight: element.height,
    };

    const handleMove = (moveEvent) => {
      if (!resizeRef.current) return;

      const dx = (moveEvent.clientX - resizeRef.current.startX) / zoom;

      const newWidth = Math.max(30, resizeRef.current.originalWidth + dx);

      const ratio =
        resizeRef.current.originalHeight / resizeRef.current.originalWidth;

      onChange(element.id, {
        width: newWidth,

        height: newWidth * ratio,
      });
    };

    const handleUp = () => {
      resizeRef.current = null;

      window.removeEventListener("mousemove", handleMove);

      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);

    window.addEventListener("mouseup", handleUp);
  };

  // ----------------------------------------------------------
  // TEXT
  // ----------------------------------------------------------

  if (element.type === "text") {
    const textareaRef = useRef(null);

    const measureTextMetrics = (value) => {
      const lines = (value || "").split("\n");
      const longest = lines.reduce(
        (max, line) => Math.max(max, line.length),
        0,
      );

      const width = Math.max(120, longest * (element.fontSize * 0.62) + 22);
      const height = Math.max(26, lines.length * element.fontSize * 1.35 + 12);

      return { width, height };
    };

    useEffect(() => {
      const input = textareaRef.current;
      if (!input) return;

      const caret = input.selectionStart ?? input.value.length;
      if (document.activeElement === input) {
        input.setSelectionRange(caret, caret);
      }

      const nextMetrics = measureTextMetrics(input.value);
      const nextWidth = Math.max(element.width || 120, nextMetrics.width);
      const nextHeight = Math.max(element.height || 26, nextMetrics.height);

      if (element.width !== nextWidth || element.height !== nextHeight) {
        onChange(element.id, {
          width: nextWidth,
          height: nextHeight,
        });
      }
    }, [
      element.text,
      element.width,
      element.height,
      element.fontSize,
      element.id,
      onChange,
    ]);

    return (
      <textarea
        ref={(node) => {
          textareaRef.current = node;
          elementRef.current = node;
        }}
        data-element="text"
        value={element.text || ""}
        onMouseDown={startDrag}
        onFocus={(event) => onSelect(event, element.id)}
        onChange={(event) => {
          const nextMetrics = measureTextMetrics(event.target.value);
          onChange(element.id, {
            text: event.target.value,
            width: Math.max(120, nextMetrics.width),
            height: Math.max(26, nextMetrics.height),
          });
        }}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        dir="ltr"
        style={{
          position: "absolute",

          left: element.x * zoom,

          top: element.y * zoom,

          width: (element.width || 120) * zoom,
          height: (element.height || 26) * zoom,

          minHeight: element.fontSize * zoom * 1.3,

          fontSize: element.fontSize * zoom,

          fontWeight: element.bold ? 700 : 400,

          fontStyle: element.italic ? "italic" : "normal",

          textDecoration: element.underline ? "underline" : "none",

          color: element.color,

          direction: "ltr",
          textAlign: "left",
          unicodeBidi: "plaintext",
          whiteSpace: "pre-wrap",
          resize: "none",
          overflow: "hidden",
          lineHeight: 1.25,

          outline: "none",

          cursor: "text",

          padding: selected ? "3px" : "1px",

          border: selected ? "1px dashed #ff5c0a" : "1px solid transparent",

          background: "transparent",

          zIndex: 30,
        }}
      />
    );
  }

  // ----------------------------------------------------------
  // IMAGE
  // ----------------------------------------------------------

  if (element.type === "image") {
    return (
      <div
        data-element="image"
        onMouseDown={startDrag}
        style={{
          position: "absolute",

          left: element.x * zoom,

          top: element.y * zoom,

          width: element.width * zoom,

          height: element.height * zoom,

          border: selected ? "2px solid #ff5c0a" : "1px solid transparent",

          zIndex: 11,

          cursor: "move",
        }}
      >
        <img
          src={element.dataUrl}
          alt="Inserted"
          draggable={false}
          className="h-full w-full object-contain"
        />

        {selected && (
          <button
            data-resize="true"
            onMouseDown={startResize}
            className="absolute -bottom-2 -right-2 h-4 w-4 rounded-sm border border-white bg-[#ff5c0a]"
            aria-label="Resize"
          />
        )}
      </div>
    );
  }

  return null;
}
