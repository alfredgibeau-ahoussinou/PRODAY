import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { platformFeedService } from '../../services/platformFeed.service';
import type { PlatformFeedPost } from '../../models/PlatformFeed';
import { SectionShell } from '../shell/SectionShell';
import { NextCard } from '../ui/NextCard';
import { NextText } from '../ui/NextText';
import { PressableSpring, StaggerReveal } from '../../components/motion';

/** Fil communautaire ProDay Next — actualités & sondages. */
export const FeedSection: React.FC = () => {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<PlatformFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const list = await platformFeedService.listForUser(profile.role);
      setPosts(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () => [...posts].sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
    [posts]
  );

  if (!profile) return null;

  return (
    <SectionShell
      sectionId="feed"
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor="#00FF9C"
        />
      }
    >
      {loading ? (
        <NextText variant="body" muted>
          Chargement…
        </NextText>
      ) : (
        sorted.map((post, i) => (
          <StaggerReveal key={post.id} index={i}>
            <NextCard variant="raised">
              <NextText variant="micro" accent>
                {post.type === 'poll' ? 'Sondage' : 'Actualité'}
              </NextText>
              <NextText variant="section">{post.title}</NextText>
              {post.body ? (
                <NextText variant="body" muted>
                  {post.body}
                </NextText>
              ) : null}
              <NextText variant="caption" muted>
                {post.author_name}
              </NextText>
            </NextCard>
          </StaggerReveal>
        ))
      )}
    </SectionShell>
  );
};
