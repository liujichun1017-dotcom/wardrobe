import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "衣橱档案",
    short_name: "衣橱档案",
    description: "记录衣物，重组造型，保存 OOTD，审查购买欲望。",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#f7f5ef",
    orientation: "portrait-primary",
  };
}
