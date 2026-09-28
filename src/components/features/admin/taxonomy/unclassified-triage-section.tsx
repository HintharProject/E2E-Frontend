"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Edit2,
  Search,
  Calendar,
  GraduationCap,
  Tag as TagIcon,
  CheckCircle2,
  X,
  AlertTriangle,
  Layers,
  Layers3,
  FileText,
  HelpCircle,
  BookOpen,
  Filter,
  ExternalLink,
} from "lucide-react";
import {
  useSubjects,
  useLevels,
  useExamYears,
  useExamSessions,
  useTagsWithMetrics,
  useUnclassifiedContents,
  useReassignUnclassifiedContent,
  UnclassifiedContentItem,
} from "@/hooks/use-exam-taxonomy";
import { formatSession, formatYear } from "@/lib/resources";

export function UnclassifiedTriageSection() {
  const [contentType, setContentType] = useState<string>("all");
  const [issueType, setIssueType] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<UnclassifiedContentItem | null>(null);

  const { data, isLoading } = useUnclassifiedContents({
    contentType,
    issueType,
    search: search.trim() || undefined,
  });

  const counts = data?.counts ?? {
    total: 0,
    posts: 0,
    problems: 0,
    lessons: 0,
    resources: 0,
    undefined_subjects: 0,
    undefined_levels: 0,
    other_years: 0,
    other_sessions: 0,
  };

  const results = data?.results ?? [];

  const getContentUrl = (item: UnclassifiedContentItem): string => {
    switch (item.content_type) {
      case "post":
        return `/posts/${item.id}`;
      case "problem":
        return `/problems/${item.id}`;
      case "lesson":
        return `/lessons/${item.id}`;
      case "resource":
        return item.file_url || `/resources?id=${item.id}`;
      default:
        return "#";
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "post":
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 py-0.5">
            <FileText className="size-3" /> Post
          </Badge>
        );
      case "problem":
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 py-0.5">
            <HelpCircle className="size-3" /> Problem
          </Badge>
        );
      case "lesson":
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-0.5">
            <BookOpen className="size-3" /> Lesson
          </Badge>
        );
      case "resource":
      default:
        return (
          <Badge variant="outline" className="text-[10px] gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 py-0.5">
            <Layers className="size-3" /> Resource
          </Badge>
        );
    }
  };

  const getIssueBadges = (issues: string[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {issues.map((issue) => {
          let label: string = issue;
          let color = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
          if (issue === "undefined_subject") {
            label = "Undefined Subject";
            color = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
          } else if (issue === "undefined_level") {
            label = "Undefined Level";
            color = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
          } else if (issue === "other_year") {
            label = "Others Year";
            color = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
          } else if (issue === "other_session") {
            label = "Others Session";
            color = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
          }
          return (
            <Badge key={issue} variant="outline" className={`text-[10px] py-0 font-medium ${color}`}>
              {label}
            </Badge>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl border border-line bg-card flex flex-col">
          <span className="text-[11px] font-medium text-ink-muted">Total Needing Triage</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-ink">{counts.total}</span>
            <AlertTriangle className={`size-5 ${counts.total > 0 ? "text-amber-500" : "text-emerald-500"}`} />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card flex flex-col">
          <span className="text-[11px] font-medium text-ink-muted">Undefined Subject</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{counts.undefined_subjects}</span>
            <GraduationCap className="size-5 text-rose-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card flex flex-col">
          <span className="text-[11px] font-medium text-ink-muted">Undefined Level</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{counts.undefined_levels}</span>
            <Layers3 className="size-5 text-rose-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card flex flex-col">
          <span className="text-[11px] font-medium text-ink-muted">Others Year</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.other_years}</span>
            <Calendar className="size-5 text-amber-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-card flex flex-col">
          <span className="text-[11px] font-medium text-ink-muted">Others Session</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.other_sessions}</span>
            <Layers className="size-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Main Content Triage Container */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden flex flex-col">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 border-b border-line bg-surface gap-3">
          {/* Content Type Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All Items", count: counts.total },
              { id: "post", label: "Posts", count: counts.posts },
              { id: "problem", label: "Problems", count: counts.problems },
              { id: "lesson", label: "Lessons", count: counts.lessons },
              { id: "resource", label: "Resources", count: counts.resources },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setContentType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  contentType === tab.id
                    ? "bg-card text-ink shadow-sm border border-line font-semibold"
                    : "text-ink-muted hover:text-ink hover:bg-card/50"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-ink-muted font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-muted pointer-events-none" />
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-line bg-surface text-xs focus:outline-none focus:border-primary text-ink"
              >
                <option value="all">All Issues</option>
                <option value="undefined_subject">Undefined Subject</option>
                <option value="undefined_level">Undefined Level</option>
                <option value="other_year">Other Year</option>
                <option value="other_session">Other Session</option>
              </select>
            </div>

            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-line bg-surface text-xs focus:outline-none focus:border-primary text-ink"
              />
            </div>
          </div>
        </div>

        {/* Content Table / List */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle2 className="size-10 text-emerald-500 mb-3" />
            <h4 className="text-sm font-semibold text-ink">Zero Unclassified Content</h4>
            <p className="text-xs text-ink-muted mt-1 max-w-sm">
              All active posts, problems, lessons, and past papers are mapped to valid subjects, levels, years, and sessions!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/50 border-b border-line text-ink-muted uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Content / Title</th>
                  <th className="p-3">Detected Issues</th>
                  <th className="p-3">Current Attributes</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {results.map((item) => (
                  <tr key={`${item.content_type}-${item.id}`} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3 align-top whitespace-nowrap">
                      {getTypeBadge(item.content_type)}
                    </td>
                    <td className="p-3 align-top max-w-xs">
                      <a
                        href={getContentUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-ink hover:text-primary hover:underline line-clamp-1 inline-flex items-center gap-1 group"
                        title="Click to view content in a new tab"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="size-3 text-ink-muted group-hover:text-primary shrink-0 opacity-70 group-hover:opacity-100" />
                      </a>
                      <div className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-2">
                        {item.author && <span>By {item.author}</span>}
                        {item.created_at && (
                          <span>• {new Date(item.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      {getIssueBadges(item.issues)}
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.subject && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] py-0 ${
                              item.subject.code === "undefined"
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
                                : ""
                            }`}
                          >
                            Sub: {item.subject.name || item.subject.code}
                          </Badge>
                        )}
                        {item.level && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] py-0 ${
                              item.level.code === "undefined"
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
                                : ""
                            }`}
                          >
                            Lvl: {item.level.name || item.level.code}
                          </Badge>
                        )}
                        {item.year !== null && item.year !== undefined && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] py-0 ${
                              String(item.year).toLowerCase() === "others" || item.year === 0
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                                : ""
                            }`}
                          >
                            Year: {formatYear(item.year)}
                          </Badge>
                        )}
                        {item.session && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] py-0 ${
                              item.session === "OTHERS"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                                : ""
                            }`}
                          >
                            Session: {formatSession(item.session)}
                          </Badge>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 w-full">
                            <TagIcon className="size-3 text-ink-muted" />
                            <span className="text-[10px] text-ink-muted">
                              {item.tags.map((t) => t.name).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={getContentUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-line bg-surface hover:bg-muted text-xs font-medium text-ink transition-colors"
                          title="Open content in new tab"
                        >
                          <ExternalLink className="size-3.5 text-ink-muted" />
                          <span>View</span>
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Edit2 className="size-3.5" /> Reclassify
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reassign Dialog */}
      {selectedItem && (
        <ReassignTaxonomyDialog
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

export function ReassignTaxonomyDialog({
  item,
  onClose,
}: {
  item: UnclassifiedContentItem;
  onClose: () => void;
}) {
  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();
  const { data: years = [] } = useExamYears();
  const { data: sessions = [] } = useExamSessions();
  const [tagSearch, setTagSearch] = useState("");
  const { data: availableTags = [] } = useTagsWithMetrics(tagSearch);

  const reassignMutation = useReassignUnclassifiedContent();

  const [subjectId, setSubjectId] = useState(item.subject?.id || "");
  const [levelId, setLevelId] = useState(item.level?.id || "");
  const [year, setYear] = useState<string | number>(item.year ?? "others");
  const [session, setSession] = useState<string>(item.session ?? "OTHERS");
  const [tags, setTags] = useState<{ id: string; name: string }[]>(item.tags || []);

  const handleAddTag = (t: { id: string; name: string }) => {
    if (!tags.some((existing) => existing.id === t.id)) {
      setTags([...tags, t]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await reassignMutation.mutateAsync({
      contentType: item.content_type,
      id: item.id,
      data: {
        subject_id: subjectId || undefined,
        level_id: levelId || undefined,
        year: item.content_type === "resource" ? String(year).toLowerCase() : undefined,
        session: item.content_type === "resource" ? session : undefined,
        tag_ids:
          item.content_type === "post" || item.content_type === "lesson"
            ? tags.map((t) => t.id)
            : undefined,
      },
    });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-ink flex items-center gap-2">
            <span>Reclassify Taxonomy</span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              {item.content_type}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Update academic subject, level, exam timeline, and tags for:
            <span className="block font-medium text-ink mt-1 truncate">&quot;{item.title}&quot;</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs mt-2">
          {/* Subject & Level Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-muted mb-1">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary text-ink"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-muted mb-1">
                Level
              </label>
              <select
                value={levelId}
                onChange={(e) => setLevelId(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs focus:outline-none focus:border-primary text-ink"
              >
                <option value="">-- Select Level --</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name} ({lvl.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resource Specific: Year and Session */}
          {item.content_type === "resource" && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface border border-line">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Exam Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-xl border border-line bg-card px-3 py-2 text-xs focus:outline-none focus:border-primary text-ink"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.year}>
                      {formatYear(y.year)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Exam Session
                </label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full rounded-xl border border-line bg-card px-3 py-2 text-xs focus:outline-none focus:border-primary text-ink"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Post / Lesson Specific: Tags Manager */}
          {(item.content_type === "post" || item.content_type === "lesson") && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface border border-line">
              <label className="text-[11px] font-medium text-ink-muted flex items-center justify-between">
                <span>Content Tags</span>
                <span className="text-[10px] text-ink-muted">{tags.length} assigned</span>
              </label>

              {/* Currently Selected Tags */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-card border border-line">
                {tags.length === 0 ? (
                  <span className="text-xs text-ink-muted italic">No tags assigned</span>
                ) : (
                  tags.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium"
                    >
                      #{t.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t.id)}
                        className="hover:text-danger text-ink-muted"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Tag Picker / Search */}
              <div className="mt-1">
                <input
                  type="text"
                  placeholder="Search available tags to add..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-ink"
                />
                {availableTags.length > 0 && tagSearch && (
                  <div className="flex flex-wrap gap-1 mt-2 max-h-24 overflow-y-auto p-1">
                    {availableTags.slice(0, 10).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleAddTag(t)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] text-ink"
                      >
                        <Plus className="size-2.5 text-primary" /> #{t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={reassignMutation.isPending}
              className="gap-1.5"
            >
              {reassignMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
              Save & Reclassify
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
