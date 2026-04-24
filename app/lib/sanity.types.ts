export type ProjectStatus = "In Dev" | "Live" | "Archived";

export interface Project {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  status: ProjectStatus;
  categories: string[];
  thumbnail?: {
    asset: { _ref: string };
  };
  url?: string;
  topics: string[];
  order: number;
}

export interface TeamMember {
  _id: string;
  name: string;
  slug: { current: string };
  role: string;
  bio: string;
  photo?: {
    asset: { _ref: string };
  };
  links?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
  order: number;
}
