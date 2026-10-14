/**
 * In-memory children list for BrightSteps.
 * Starts empty — filled by:
 *   - ChildrenRemote.fetchAll() when Supabase is online
 *   - ChildRegistry.ensureMerged() from LocalStorage when offline
 * Demo seed rows removed so online mode never mixes sample kids with real data.
 */
const SampleChildren = [];

if (typeof window !== 'undefined') {
  window.SampleChildren = SampleChildren;
}
