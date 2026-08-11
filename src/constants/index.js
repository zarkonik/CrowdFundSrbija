import { createCampaign, dashboard, logout, profile } from "../assets";

export const categories = [
  "Music",
  "Painting",
  "Architecture",
  "Photography",
  "Sculpture",
  "Film & Video",
  "Writing",
  "Theater & Performing Arts",
  "Crafts & Handmade",
  "Personal",
  "Other",
];

export const navlinks = [
  {
    name: "dashboard",
    imgUrl: dashboard,
    link: "/explore",
  },
  {
    name: "campaign",
    imgUrl: createCampaign,
    link: "/create-campaign",
  },
  {
    name: "profile",
    imgUrl: profile,
    link: "/profile",
  },
  {
    name: "logout",
    imgUrl: logout,
    link: "/",
  },
];
