import { createFileRoute } from '@tanstack/react-router';
import Navbar, { NavbarActionProps } from '../components/sections/navbar/default';
import Hero, { HeroButtonProps } from '../components/sections/hero/default';
import landingPageContent from '../../content/landingpage.json';
import { ArrowRightIcon } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const { navbar, hero } = landingPageContent;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        name={navbar.name}
        homeUrl={navbar.homeUrl}
        mobileLinks={navbar.mobileLinks}
        actions={navbar.actions as NavbarActionProps[]}
        showNavigation={false}
      />
      <Hero
        title={hero.title}
        description={hero.description}
        badge={
          <Badge variant="outline" className="animate-appear">
            <span className="text-muted-foreground">
              {hero.badge.text}
            </span>
            <a href={hero.badge.href} className="flex items-center gap-1">
              
              <ArrowRightIcon className="size-3" />
            </a>
          </Badge>
        }
        buttons={hero.buttons as HeroButtonProps[]}
      />
    </div>
  );
}
