import { createFlexCarousel } from "./flexcarousel.js";

// Put your photos into public/photos/ with these names (or change the list).
// A missing photo shows a numbered placeholder card instead.
const PHOTOS = [
  { src: "photos/gallery-01.jpg", title: "Three brothers", subtitle: "21 · 17 · 16" },
  { src: "photos/gallery-02.jpg", title: "Mum and Dad", subtitle: "our parents" },
  { src: "photos/gallery-03.jpg", title: "Big family dinner", subtitle: "all eleven of us" },
  { src: "photos/gallery-04.jpg", title: "With my cousins", subtitle: "mum's side" },
  { src: "photos/gallery-05.jpg", title: "New Year's Eve", subtitle: "2025" },
  { src: "photos/gallery-06.jpg", title: "Summer trip", subtitle: "2024" },
  { src: "photos/gallery-07.jpg", title: "When we were little", subtitle: "old photo" },
  { src: "photos/gallery-08.jpg", title: "The Trubchik family", subtitle: "2026" },
];

const slide = document.querySelector(".gallery-slide");
let started = false;

// Build the carousel the first time its slide is shown, so the intro plays in front of the audience
function maybeStart() {
  if (started || !slide.classList.contains("active")) return;
  started = true;
  createFlexCarousel(document.getElementById("gallery"), {
    items: PHOTOS.map((p) => ({ ...p, alt: p.title })),
    preset: "liquid",
    intro: "rise",
    cardHeight: 0.62,
    gap: 12,
    squeeze: 0.2,
    focusOnClick: true,
    captions: true,
  });
}

document.addEventListener("slidechange", maybeStart);
maybeStart();
