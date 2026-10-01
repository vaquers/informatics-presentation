import { createFlexCarousel } from "./flexcarousel.js";

// Put your photos into public/photos/ with these names (or change the list).
// A missing photo shows a numbered placeholder card instead.
const PHOTOS = [
  { src: "photos/gallery-01.jpg", title: "All five of us", subtitle: "family photo shoot" },
  { src: "photos/gallery-02.jpg", title: "When we were little", subtitle: "an old photo" },
  { src: "photos/gallery-03.jpg", title: "Three brothers", subtitle: "summer at home" },
  { src: "photos/gallery-04.jpg", title: "Brothers on the road", subtitle: "a bus trip" },
  { src: "photos/gallery-05.jpg", title: "Meet our cat", subtitle: "the real boss of the house" },
  { src: "photos/gallery-06.jpg", title: "Mum and Dad", subtitle: "travelling together" },
  { src: "photos/gallery-07.jpg", title: "Mum in the sky", subtitle: "flying high" },
  { src: "photos/gallery-08.jpg", title: "Sunset from above", subtitle: "a balloon flight" },
  { src: "photos/gallery-09.jpg", title: "We landed!", subtitle: "champagne and a certificate" },
  { src: "photos/gallery-10.jpg", title: "Just the guys", subtitle: "a fun evening" },
  { src: "photos/gallery-11.jpg", title: "Summer by the water", subtitle: "brothers and friends" },
  { src: "photos/gallery-12.jpg", title: "A big trip together", subtitle: "on the pier" },
  { src: "photos/gallery-13.jpg", title: "A family celebration", subtitle: "with grandma" },
  { src: "photos/gallery-14.jpg", title: "Big family dinner", subtitle: "everyone at one table" },
  { src: "photos/gallery-15.jpg", title: "Christmas together", subtitle: "Shanti too" },
  { src: "photos/gallery-16.jpg", title: "Tima", subtitle: "in a festive mood" },
  { src: "photos/gallery-17.jpg", title: "Me and my cousin", subtitle: "just chilling" },
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
