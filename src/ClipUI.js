import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./ClipUI.css";
import jsPDF from "jspdf";
import * as exifr from "exifr";

export default function ClipUI() {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // for modal
  const [displayImages, setDisplayImages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchImage, setIsSearchImage] = useState(false); // track if selected image is from search results
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/images.json")
      .then((res) => res.json())
      .then((imageNames) => {
        const imagePaths = imageNames.map((name) => ({
          url: process.env.PUBLIC_URL + `/images/${name}`,
          thumbnailURL: process.env.PUBLIC_URL + `/thumbnails/${name}`,
        }));

        const startIndex = Math.floor(
          Math.random() * Math.max(0, imagePaths.length - 32)
        );
        setDisplayImages(imagePaths.slice(startIndex, startIndex + 32));
      });
  }, []);

  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const images = isSearchImage ? searchResults : displayImages;
        const currentIdx = images.findIndex((img) => img.url === selectedImage);
        if (currentIdx === -1) return;

        if (e.key === "ArrowLeft") {
          const prevIdx = (currentIdx - 1 + images.length) % images.length;
          setSelectedImage(images[prevIdx].url);
        }
        if (e.key === "ArrowRight") {
          const nextIdx = (currentIdx + 1) % images.length;
          setSelectedImage(images[nextIdx].url);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, isSearchImage, searchResults, displayImages]);

  const handleSearch = () => {
    console.log("Searching text:", text);
    fetch("http://localhost:5001/embed-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Search results:", data);
        const searchImagePaths = data.filenames.map((name) => ({
          url: process.env.PUBLIC_URL + `/images/${name}`,
          thumbnailURL: process.env.PUBLIC_URL + `/thumbnails/${name}`,
        }));
        setSearchResults(searchImagePaths);
      })
      .catch((err) => {
        console.error("Error during search:", err);
      });
  };

  const generateAlbumPDF = async () => {
    setIsGenerating(true);
    try {
      // A4 landscape size for elegant Korean style
      const width = 297;
      const height = 210;
      const margin = 20;

      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "landscape",
      });

      // Korean-inspired color palette
      const colors = {
        primary: "#F8F6F0", // warm cream
        secondary: "#E8DDD4", // soft beige
        accent: "#D4A574", // muted gold
        text: "#5D4E37", // coffee brown
        lightText: "#8B7355", // lighter brown
        border: "#E0D5C7", // subtle border
      };

      const loadImg = async (url) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;

        await new Promise((resolve) => (img.onload = resolve));

        // Extract EXIF metadata
        const metadata = await exifr.parse(url, { gps: true });

        return {
          w: img.width,
          h: img.height,
          img,
          fileName: url.split("/").pop(),
          time: metadata?.DateTimeOriginal || "Unknown Time",
          location:
            metadata?.latitude && metadata?.longitude
              ? `${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(
                  6
                )}`
              : "Unknown Location",
        };
      };

      const imgs = await Promise.all(
        searchResults.slice(0, 16).map((r) => loadImg(r.url))
      );

      // Korean-style decorative elements
      const drawDecoFrame = (x, y, w, h, radius = 3) => {
        doc.setFillColor(colors.primary);
        doc.roundedRect(x - 2, y - 2, w + 4, h + 4, radius, radius, "F");
        doc.setDrawColor(colors.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(
          x - 1,
          y - 1,
          w + 2,
          h + 2,
          radius - 1,
          radius - 1,
          "S"
        );
      };

      const drawFlowerAccent = (x, y) => {
        doc.setFillColor(colors.accent);
        for (let i = 0; i < 5; i++) {
          const angle = (i * 72 * Math.PI) / 180;
          const px = x + Math.cos(angle) * 2;
          const py = y + Math.sin(angle) * 2;
          doc.circle(px, py, 0.8, "F");
        }
        doc.setFillColor(colors.secondary);
        doc.circle(x, y, 1.2, "F");
      };

      // ---- ELEGANT COVER ---- //
      doc.setFillColor(colors.primary);
      doc.rect(0, 0, width, height, "F");

      // Decorative border
      doc.setDrawColor(colors.accent);
      doc.setLineWidth(0.5);
      doc.rect(15, 15, width - 30, height - 30, "S");
      doc.rect(18, 18, width - 36, height - 36, "S");

      // Flower accents on corners
      drawFlowerAccent(25, 25);
      drawFlowerAccent(width - 25, 25);
      drawFlowerAccent(25, height - 25);
      drawFlowerAccent(width - 25, height - 25);

      // Title with elegant typography
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(28);
      doc.setTextColor(colors.text);
      doc.text("Beautiful Moments", width / 2, height / 2 - 30, {
        align: "center",
      });

      doc.setFontSize(16);
      doc.setTextColor(colors.lightText);
      doc.text("Memory Collection", width / 2, height / 2 - 15, {
        align: "center",
      });

      // Subtitle with Korean aesthetic
      doc.setFontSize(11);
      doc.setTextColor(colors.lightText);
      doc.text(
        "— A Collection of Precious Memories —",
        width / 2,
        height / 2 + 5,
        {
          align: "center",
        }
      );

      // Date
      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.setFontSize(9);
      doc.text(today, width / 2, height / 2 + 25, { align: "center" });

      // ---- INTRO PAGE WITH COLLAGE ---- //
      doc.addPage();
      doc.setFillColor(colors.primary);
      doc.rect(0, 0, width, height, "F");

      if (imgs.length >= 4) {
        // Use cleaner grid layout like the commented version
        doc.setFont("Helvetica", "normal");
        doc.setFillColor(colors.text);
        doc.setFontSize(16);
        doc.text("Top Search Results", width / 2, 25, { align: "center" });

        // 2x2 grid layout (inspired by commented version)
        const grid = imgs.slice(0, 4);
        const gap = 8;
        const gridStartX = 50;
        const gridStartY = 35;
        const cellW = (width - gridStartX * 2 - gap) / 2;
        const cellH = (height - gridStartY - 30 - gap) / 2;

        grid.forEach((item, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);

          const x = gridStartX + col * (cellW + gap);
          const y = gridStartY + row * (cellH + gap);

          const { w: imgW, h: imgH, img } = item;

          // Clean white frame (like commented version)
          doc.setFillColor("#ffffff");
          doc.roundedRect(x, y, cellW, cellH, 3, 3, "F");
          doc.setDrawColor(colors.border);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, y, cellW, cellH, 3, 3, "S");

          // Calculate image fit within cell
          const scale = Math.min((cellW - 4) / imgW, (cellH - 4) / imgH);
          const finalW = imgW * scale;
          const finalH = imgH * scale;
          const imgX = x + (cellW - finalW) / 2;
          const imgY = y + (cellH - finalH) / 2;

          doc.addImage(img, "JPEG", imgX, imgY, finalW, finalH);
        });

        // Simple decorative elements instead of scattered chaos
        doc.setFillColor(colors.accent);
        doc.circle(30, height - 20, 2, "F");
        doc.circle(width - 30, height - 20, 2, "F");
      } else {
        // Fallback for fewer images
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(16);
        doc.setTextColor(colors.text);
        doc.text("Search Results", width / 2, height / 2, { align: "center" });
      }

      // ---- INDIVIDUAL PHOTO PAGES ---- //
      for (let i = 0; i < Math.min(imgs.length, 16); i++) {
        const { w: imgW, h: imgH, img, fileName, time, location } = imgs[i];
        doc.addPage();

        // Soft background
        doc.setFillColor(colors.primary);
        doc.rect(0, 0, width, height, "F");

        // Main photo area with elegant frame
        const maxPhotoW = width - 80;
        const maxPhotoH = height - 80;
        const scale = Math.min(maxPhotoW / imgW, maxPhotoH / imgH);
        const photoW = imgW * scale;
        const photoH = imgH * scale;
        const photoX = (width - photoW) / 2;
        const photoY = 40;

        // Create shadow effect
        doc.setFillColor("#00000008");
        doc.roundedRect(photoX + 2, photoY + 2, photoW, photoH, 3, 3, "F");

        // Main photo frame
        drawDecoFrame(photoX, photoY, photoW, photoH, 3);
        doc.addImage(img, "JPEG", photoX, photoY, photoW, photoH);

        // Add metadata below the image
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(colors.text);
        const formattedTime = new Date(time).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        doc.text(`Date: ${formattedTime}`, width / 2, photoY + photoH + 20, {
          align: "center",
        });
        if (location !== "Unknown Location") {
          doc.text(`Location: ${location}`, width / 2, photoY + photoH + 30, {
            align: "center",
          });
        }

        // Photo number
        doc.setFontSize(24);
        doc.setTextColor(colors.accent);
        const pageNum = String(i + 1).padStart(2, "0");
        doc.text(pageNum, 30, 30);
      }

      // ---- ENDING PAGE ---- //
      doc.addPage();
      doc.setFillColor(colors.primary);
      doc.rect(0, 0, width, height, "F");

      // Center message
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(20);
      doc.setTextColor(colors.text);
      doc.text(
        "Thank You for These Beautiful Times",
        width / 2,
        height / 2 - 10,
        {
          align: "center",
        }
      );

      doc.setFontSize(12);
      doc.setTextColor(colors.lightText);
      doc.text("Cherishing every precious moment", width / 2, height / 2 + 10, {
        align: "center",
      });

      // Final decorative elements (adjusted for landscape)
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45 * Math.PI) / 180;
        const radius = 30;
        const x = width / 2 + Math.cos(angle) * radius;
        const y = height / 2 + Math.sin(angle) * radius;
        drawFlowerAccent(x, y);
      }

      doc.save("beautiful_moments_album.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // const generateAlbumPDF = async () => {
  //   // Landscape photobook
  //   const width = 300;
  //   const height = 210;
  //   const margin = 12;

  //   const doc = new jsPDF({
  //     unit: "mm",
  //     format: [width, height],
  //     orientation: "landscape",
  //   });

  //   const maxSingleW = width - margin * 2;
  //   const maxSingleH = height - margin * 2 - 10;

  //   const fillBackground = () => {
  //     doc.setFillColor("#ffffff");
  //     doc.rect(0, 0, width, height, "F");
  //   };

  //   // load image utility
  //   const loadImg = (url) =>
  //     new Promise((resolve) => {
  //       const i = new Image();
  //       i.onload = () => resolve({ w: i.width, h: i.height, img: i });
  //       i.crossOrigin = "anonymous";
  //       i.src = url;
  //     });

  //   const imgs = await Promise.all(
  //     searchResults.slice(0, 20).map((r) => loadImg(r.url))
  //   );

  //   // ---- COVER ---- //
  //   fillBackground();
  //   doc.setFont("Helvetica", "bold");
  //   doc.setFontSize(38);
  //   doc.setTextColor("#222");
  //   doc.text("CLIP Album", width / 2, height / 2 - 8, { align: "center" });

  //   doc.setFont("Helvetica", "normal");
  //   doc.setFontSize(14);
  //   doc.setTextColor("#666");
  //   doc.text("Generated by your CLIP system", width / 2, height / 2 + 10, {
  //     align: "center",
  //   });

  //   // ---- FIRST PHOTO PAGE: 2x2 grid ---- //
  //   doc.addPage();
  //   fillBackground();
  //   doc.setFontSize(16);
  //   doc.setTextColor("#333");
  //   doc.text("Top 4 Images", width / 2, 10, { align: "center" });

  //   const grid = imgs.slice(0, 4);
  //   const gap = 6;
  //   const cellW = (width - margin * 2 - gap) / 2;
  //   const cellH = (height - margin * 2 - gap - 10) / 2;

  //   grid.forEach((item, idx) => {
  //     const col = idx % 2;
  //     const row = Math.floor(idx / 2);

  //     const x = margin + col * (cellW + gap);
  //     const y = margin + row * (cellH + gap) + 10;

  //     const r = Math.min(cellW / item.w, cellH / item.h);
  //     const w = item.w * r;
  //     const h = item.h * r;
  //     const cx = x + (cellW - w) / 2;
  //     const cy = y + (cellH - h) / 2;

  //     // subtle background frame
  //     doc.setFillColor("#ffffff");
  //     doc.roundedRect(x, y, cellW, cellH, 2, 2, "F");

  //     doc.addImage(item.img, "JPEG", cx, cy, w, h);
  //   });

  //   // ---- Remaining images: ONE per page ---- //
  //   for (let i = 4; i < imgs.length; i++) {
  //     const { w, h, img } = imgs[i];
  //     doc.addPage();
  //     fillBackground();

  //     const scale = Math.min(maxSingleW / w, maxSingleH / h);
  //     const pw = w * scale;
  //     const ph = h * scale;
  //     const px = (width - pw) / 2;
  //     const py = (height - ph) / 2;

  //     // soft frame
  //     doc.setFillColor("#ffffff");
  //     doc.roundedRect(px - 2, py - 2, pw + 4, ph + 4, 3, 3, "F");
  //     doc.addImage(img, "JPEG", px, py, pw, ph);

  //     doc.setFontSize(10);
  //     doc.setTextColor("#666");
  //     doc.text(`Image #${i + 1}`, width / 2, height - 5, { align: "center" });
  //   }

  //   doc.save("clip_album.pdf");
  // };
  return (
    <div className="clip-container">
      <h1 className="clip-title">CLIP Album Generation System</h1>

      {/* Show loading spinner or message */}
      {isGenerating && (
        <div className="clip-loading-overlay">
          <div className="clip-spinner"></div>
          <p className="clip-loading-text">Generating album, please wait...</p>
        </div>
      )}

      <div className="clip-grid">
        <div className="clip-card">
          <h2 className="clip-card-title">Search with Text</h2>
          <textarea
            placeholder="Enter text to search images..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="clip-textarea"
          />
          <button onClick={handleSearch} className="clip-btn clip-btn-blue">
            Search
          </button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="clip-img-section">
          <button
            className="clip-btn clip-btn-green"
            style={{ margin: "16px 0" }}
            onClick={() => generateAlbumPDF("dark")}
          >
            Download Album PDF
          </button>
          <h2 className="clip-card-title">Search Results</h2>
          <div className="clip-img-grid">
            {searchResults.map((img, idx) => (
              <div
                key={idx}
                className="clip-img-wrapper"
                onClick={() => {
                  setSelectedImage(img.url);
                  setIsSearchImage(true); // mark as search image
                }}
              >
                <img
                  src={img.thumbnailURL}
                  alt={`search-img-${idx}`}
                  className="clip-img"
                  style={{ cursor: "pointer" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="clip-img-section">
        <h2 className="clip-card-title">Random 32 Images from Folder</h2>
        <div className="clip-img-grid">
          {displayImages.map((img, idx) => (
            <div
              key={idx}
              className="clip-img-wrapper"
              onClick={() => {
                setSelectedImage(img.url);
                setIsSearchImage(false); // mark as random image
              }}
            >
              <img
                src={img.thumbnailURL}
                alt={`img-${idx}`}
                className="clip-img"
                style={{ cursor: "pointer" }}
              />
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="clip-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="clip-modal-close"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            <button
              className="clip-modal-arrow clip-modal-arrow-left"
              onClick={() => {
                const images = isSearchImage ? searchResults : displayImages;
                const currentIdx = images.findIndex(
                  (img) => img.url === selectedImage
                );
                if (currentIdx === -1) return;
                const prevIdx =
                  (currentIdx - 1 + images.length) % images.length;
                setSelectedImage(images[prevIdx].url);
              }}
            >
              &#8592;
            </button>
            <button
              className="clip-modal-arrow clip-modal-arrow-right"
              onClick={() => {
                const images = isSearchImage ? searchResults : displayImages;
                const currentIdx = images.findIndex(
                  (img) => img.url === selectedImage
                );
                if (currentIdx === -1) return;
                const nextIdx = (currentIdx + 1) % images.length;
                setSelectedImage(images[nextIdx].url);
              }}
            >
              &#8594;
            </button>
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                src={selectedImage}
                alt="full-view"
                className="clip-modal-img"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
