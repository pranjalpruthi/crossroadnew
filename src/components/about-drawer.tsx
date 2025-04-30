import React from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Github, Twitter, Linkedin, Globe, BookOpen, GraduationCap, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  image: string;
  links: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
    scholar?: string;
    researchgate?: string;
    email?: string;
  };
}

const team: TeamMember[] = [
  {
    name: "Pranjal Pruthi",
    role: "Core Web Developer & Research Scientist",
    bio: "Research Scientist at CSIR-IGIB: Exploring the frontiers of genomics | Skilled in IT, Full Stack Web development, Database Administration and Bioinformatics, Building innovative and user-friendly platforms",
    avatar: "bg-gradient-to-br from-purple-500 to-pink-500",
    image: "https://pbs.twimg.com/profile_images/1866546460919205889/XF3K4o86_400x400.jpg",
    links: {
      github: "https://github.com/pranjalpruthi",
      linkedin: "https://www.linkedin.com/in/pranjal-pruthi/",
      twitter: "https://x.com/pranjalpruthi",
      website: "https://pranjal.mmm.page",
      email: "mail@pbro.in"
    }
  },
  {
    name: "Preeti Agarwal",
    role: "Documentation - PhD & Senior Research Fellow",
    bio: "Institute of Genomics and Integrative Biology | IGIB · Genome Informatics and Structural Biology Research Area (IGIB) | Bioinformatics and Big Data analysis #Pro in SSR analysis",
    avatar: "bg-gradient-to-br from-rose-400 to-orange-500",
    image: "https://pbs.twimg.com/profile_images/1526164953585295360/3WX0lSZn_400x400.jpg",
    links: {
      researchgate: "https://www.researchgate.net/profile/Preeti-Agarwal-16",
      scholar: "https://scholar.google.com/citations?user=8u8WcwoAAAAJ&hl=en"
    }
  },
  {
    name: "Dr. Jitendra Narayan",
    role: "Principal Investigator",
    bio: "Specializing in Comparative Genomics, Genome Evolution, Adaptation, Chromosome Rearrangements, HGT, Repeats",
    avatar: "bg-gradient-to-br from-blue-500 to-green-500",
    image: "https://pbs.twimg.com/profile_images/1759517165764427777/-q4XxNJW_400x400.jpg",
    links: {
      website: "https://bioinformaticsonline.com/profile/admin",
      scholar: "https://scholar.google.co.uk/citations?user=ySm4BzcAAAAJ&hl=en",
      researchgate: "https://www.researchgate.net/profile/Jitendra-Narayan-3",
      twitter: "https://x.com/jnarayan81"
    }
  }
];

// Define animations
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function AboutDrawer({ children }: { children?: React.ReactNode }) {
  // Format team data for AnimatedTooltip
  const teamTooltipItems = team.map((member, index) => ({
    id: index,
    name: member.name,
    designation: member.role,
    image: member.image
  }));

  return (
    <Drawer.Root direction="right">
      <Drawer.Trigger asChild>
        {children || <Button variant="ghost" className="hover:bg-accent/50 h-9">About</Button>}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/80 z-50" />
        <Drawer.Content className="bg-background text-foreground fixed right-0 top-0 flex h-full w-[90vw] flex-col rounded-l-lg border p-6 sm:w-[90vw] lg:w-[50vw] z-50 overflow-y-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl mx-auto w-full"
          >
            <motion.div variants={fadeIn}>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">About CROSSROAD</h2>
                <p className="text-muted-foreground">
                  CROSSROAD is a comprehensive tool for comparing Simple Sequence Repeats (SSRs) across multiple species and families, enabling deeper insights into genomic evolution and diversity.
                </p>
              </div>
            </motion.div>

            <div className="mt-6 space-y-6">
              <motion.div variants={fadeIn}>
                {/* Project Description */}
                <h3 className="text-lg font-semibold mb-2">Project Overview</h3>
                <p className="text-muted-foreground">
                  CROSSROAD provides a robust framework for analyzing SSR variations across genomes, identifying hotspots, and tracing evolutionary patterns. Its high-throughput pipeline handles genomic data efficiently, with a comprehensive suite of visualization tools for exploring complex relationships within SSR distributions.
                </p>
              </motion.div>

              <Separator />

              {/* Key Features */}
              <motion.div variants={fadeIn}>
                <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                  <li>Comparing SSR variations across genomes at different classification levels</li>
                  <li>Identifying hotspot genes where SSR variations have accumulated</li>
                  <li>Tracing evolutionary patterns of SSRs within genes</li>
                  <li>Detecting conserved SSR markers with flanking regions for primer design</li>
                  <li>Interactive visualization of complex SSR relationships</li>
                  <li>Support for both reference-based and reference-free SSR analysis</li>
                </ul>
              </motion.div>

              <Separator />

              {/* Team Section */}
              <motion.div variants={fadeIn}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Development Team</h3>
                  <Badge variant="secondary" className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0">
                    Lab of Bioinformatics and Big Data
                  </Badge>
                </div>
                
                {/* Team Animated Tooltip */}
                <motion.div 
                  className="flex justify-center mb-8"
                  variants={fadeIn}
                >
                  <div className="flex items-center justify-center gap-2">
                    <AnimatedTooltip items={teamTooltipItems} />
                  </div>
                </motion.div>
                
                <motion.div 
                  className="space-y-6"
                  variants={staggerContainer}
                >
                  {/* Team Members - Development Team First */}
                  {[team[0], team[1]].map((member) => (
                    <motion.div
                      key={member.name}
                      variants={fadeIn}
                      className="flex items-start space-x-4"
                    >
                      <Avatar className={cn("h-12 w-12", member.avatar)}>
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback className="text-white">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-sm font-semibold">{member.name}</h4>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.bio}</p>
                        <div className="flex space-x-2">
                          {member.links.github && (
                            <a href={member.links.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <Github className="h-4 w-4" />
                            </a>
                          )}
                          {member.links.twitter && (
                            <a href={member.links.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <Twitter className="h-4 w-4" />
                            </a>
                          )}
                          {member.links.linkedin && (
                            <a href={member.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <Linkedin className="h-4 w-4" />
                            </a>
                          )}
                          {member.links.website && (
                            <a href={member.links.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <Globe className="h-4 w-4" />
                            </a>
                          )}
                          {member.links.scholar && (
                            <a href={member.links.scholar} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <GraduationCap className="h-4 w-4" />
                            </a>
                          )}
                          {member.links.researchgate && (
                            <a href={member.links.researchgate} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <BookOpen className="h-4 w-4" />
                            </a>
                          )}
                          {member.links.email && (
                            <a href={`mailto:${member.links.email}`} className="text-muted-foreground hover:text-primary">
                              <Mail className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <Separator className="my-4" />

                  {/* PI Section */}
                  <motion.div variants={fadeIn}>
                    <div className="flex items-start space-x-4">
                      <Avatar className={cn("h-12 w-12", team[2].avatar)}>
                        <AvatarImage src={team[2].image} alt={team[2].name} />
                        <AvatarFallback className="text-white">
                          {team[2].name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-sm font-semibold">{team[2].name}</h4>
                          <p className="text-sm text-muted-foreground">{team[2].role}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{team[2].bio}</p>
                        <div className="flex space-x-2">
                          {team[2].links.website && (
                            <a href={team[2].links.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <Globe className="h-4 w-4" />
                            </a>
                          )}
                          {team[2].links.scholar && (
                            <a href={team[2].links.scholar} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <GraduationCap className="h-4 w-4" />
                            </a>
                          )}
                          {team[2].links.researchgate && (
                            <a href={team[2].links.researchgate} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <BookOpen className="h-4 w-4" />
                            </a>
                          )}
                          {team[2].links.twitter && (
                            <a href={team[2].links.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <Twitter className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>

              <Separator />

              {/* Workflow */}
              <motion.div variants={fadeIn}>
                <h3 className="text-lg font-semibold mb-2">Workflow Overview</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Stage 1:</strong> Genome Quality Assessment & SSR Detection</p>
                  <p><strong>Stage 2:</strong> Gene-Level SSR Association Analysis</p>
                  <p><strong>Stage 3:</strong> Multi-Modal Data Visualization</p>
                  <p><strong>Stage 4:</strong> Results Aggregation & Dissemination</p>
                </div>
              </motion.div>

              <Separator />

              {/* Funding & Institution */}
              <motion.div variants={fadeIn}>
                <h3 className="text-lg font-semibold mb-2">Funding & Institution</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    This project is funded by the Rockefeller Foundation.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hosted at CSIR Institute of Genomics and Integrative Biology (CSIR-IGIB), Delhi, India.
                  </p>
                </div>
              </motion.div>

              <Separator />

              {/* Citation */}
              <motion.div variants={fadeIn}>
                <h3 className="text-lg font-semibold mb-2">Citation</h3>
                <code className="block text-sm bg-muted p-4 rounded-md">
                  Pruthi, P., Narayan, J., & Agarwal, P. (2024). CROSSROAD: A tool to cross-compare SSRs across species and families. CSIR-IGIB.
                </code>
              </motion.div>

              {/* Close button */}
              <div className="flex justify-end pt-4">
                <Drawer.Close asChild>
                  <Button variant="outline">Close</Button>
                </Drawer.Close>
              </div>
            </div>
          </motion.div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
} 