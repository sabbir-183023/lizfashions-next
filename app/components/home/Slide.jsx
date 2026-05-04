// app/components/home/Slides.jsx
"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import "../../styles/Slide.scss";

// Shimmer loading component - Fixed to prevent overflow
const ShimmerCard = () => (
  <div className="shimmer-card-wrapper">
    <div className="shimmer-card" />
  </div>
);

const Slides = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const slideIntervalRef = useRef(null);

  // Fetch content from Next.js API route
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/slide");
      const data = await res.json();

      if (Array.isArray(data)) {
        setContents(data);
      } else if (data?.data && Array.isArray(data.data)) {
        setContents(data.data);
      } else if (data?.slides && Array.isArray(data.slides)) {
        setContents(data.slides);
      } else {
        setContents([]);
      }

      setLoading(false);

      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } catch (error) {
      console.log("Error fetching slides:", error);
      setLoading(false);

      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/slide");
        const data = await res.json();

        if (!isMounted) return;

        if (Array.isArray(data)) {
          setContents(data);
        } else if (data?.data && Array.isArray(data.data)) {
          setContents(data.data);
        } else if (data?.slides && Array.isArray(data.slides)) {
          setContents(data.slides);
        } else {
          setContents([]);
        }

        setLoading(false);

        requestAnimationFrame(() => {
          if (isMounted) setIsVisible(true);
        });
      } catch (error) {
        console.log("Error fetching slides:", error);
        if (isMounted) {
          setLoading(false);
          requestAnimationFrame(() => {
            if (isMounted) setIsVisible(true);
          });
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, []);

  // Get the three images to display
  const visibleImages = useMemo(() => {
    if (!contents.length) return [];

    const totalImages = contents.length;
    return [
      contents[(currentIndex - 1 + totalImages) % totalImages],
      contents[currentIndex],
      contents[(currentIndex + 1) % totalImages],
    ];
  }, [contents, currentIndex]);

  // Auto slide effect
  useEffect(() => {
    if (!contents.length || loading) return;

    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
    }

    slideIntervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contents.length);
    }, 3500);

    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [contents.length, loading]);

  // Handle manual dot click
  const handleDotClick = useCallback(
    (idx) => {
      if (idx === currentIndex) return;

      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }

      setCurrentIndex(idx);

      slideIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % contents.length);
      }, 3500);
    },
    [currentIndex, contents.length]
  );

  if (loading) {
    return (
      <div className="slides-container-loading">
        <div className="slides-wrapper-loading">
          <ShimmerCard />
        </div>
      </div>
    );
  }

  if (!contents.length) {
    return (
      <div className={`slides-container ${!isVisible ? "hidden" : ""}`}>
        <div className="text-center">
          <p className="text-gray-500">No slides available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`slides-container ${!isVisible ? "hidden" : ""}`}>
      <div className="slides-wrapper">
        {visibleImages.map((image, index) => {
          const position =
            index === 0 ? "left" : index === 1 ? "center" : "right";

          return (
            <div
              key={`${image._id || image.id || index}`}
              className={`slide-item ${position}`}
            >
              <div className={`image-container ${position}`}>
                <Image
                  src={image.image}
                  alt={image.title || "Slide image"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="slide-image"
                  priority={position === "center"}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="dots-container">
        {contents.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleDotClick(idx)}
            className={`dot-button ${
              idx === currentIndex ? "active" : "inactive"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Slides;