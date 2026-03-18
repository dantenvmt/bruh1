import type { ChangeEvent } from 'react';
import { CheckCircle2, FileText, Loader2, Trash2, Upload, WandSparkles } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
} from '@nextui-org/react';

import type { CritiqueLevel, OptimizeMode, ResumeAnalysisResponse, ResumeMatchProfile } from '@/api/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ResumeLabPanelProps {
  resumeFileName: string | null;
  resumeUploaded: boolean;
  optimizeMode: OptimizeMode;
  onOptimizeModeChange: (value: OptimizeMode) => void;
  critiqueLevel: CritiqueLevel;
  onCritiqueLevelChange: (value: CritiqueLevel) => void;
  onUpload: (file: File) => void;
  onClearResume: () => void;
  onAnalyzeResume: () => void;
  isUploading: boolean;
  isAnalyzing: boolean;
  analysis: ResumeAnalysisResponse | null;
  matchProfile: ResumeMatchProfile | null;
  errorMessage: string | null;
}

const OPTIMIZE_MODE_DESCRIPTIONS: Record<OptimizeMode, string> = {
  bullets: 'Improve individual bullet points to match the role',
  overview: 'Rewrite your professional summary for the job',
  full_rewrite: 'Rewrite the entire resume tailored to this job',
};

export function ResumeLabPanel({
  resumeFileName,
  resumeUploaded,
  optimizeMode,
  onOptimizeModeChange,
  critiqueLevel,
  onCritiqueLevelChange,
  onUpload,
  onClearResume,
  onAnalyzeResume,
  isUploading,
  isAnalyzing,
  analysis,
  matchProfile,
  errorMessage,
}: ResumeLabPanelProps) {
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.currentTarget.value = '';
  };

  return (
    <Card
      className="h-full rounded-[1.3rem] border border-white/10 bg-card/85 shadow-xl shadow-black/25 backdrop-blur"
      shadow="none"
    >
      <CardBody className="flex h-full flex-col gap-3 p-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Resume Lab
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-tight">AI Resume Optimization</h3>
        </div>

        {/* Upload */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Upload Resume (PDF)
          </span>
          <Input
            type="file"
            accept=".pdf"
            onChange={onFileChange}
            isDisabled={isUploading}
            variant="bordered"
            size="sm"
            classNames={{
              input: "text-foreground text-xs",
              inputWrapper: "border-white/10 bg-white/5 hover:bg-white/10 data-[focus=true]:border-primary/50",
            }}
          />
        </label>

        {/* Status */}
        <div className="rounded-xl border border-white/10 bg-background/45 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">Current resume</div>
            {resumeUploaded && (
              <Button
                variant="light"
                size="sm"
                onPress={onClearResume}
                className="h-6 min-w-0 px-2 text-xs text-muted-foreground"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-sm">
            {resumeUploaded ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate text-xs">
              {resumeFileName || (resumeUploaded ? 'Resume uploaded' : 'No resume uploaded')}
            </span>
          </div>
          {/* Match profile notice */}
          {resumeUploaded && matchProfile && (
            <div className="mt-1.5 text-xs text-muted-foreground">
              {matchProfile.skills_extracted ? (
                <span className="text-emerald-600">
                  {matchProfile.skills.length} skills extracted
                  {matchProfile.experience_years != null ? ` · ${matchProfile.experience_years} yrs exp` : ''}
                  {' · '}Match scoring active
                </span>
              ) : (
                <span className="text-amber-500">
                  Skills not extracted — match scoring unavailable
                </span>
              )}
            </div>
          )}
        </div>

        {isUploading && (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-background/50 p-2 text-xs text-muted-foreground">
            <Upload className="h-3.5 w-3.5 shrink-0" />
            Uploading and extracting profile...
          </div>
        )}

        {/* General Analysis */}
        <div className="space-y-2">
          <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            General Analysis
          </span>
          <Select value={critiqueLevel} onValueChange={(v) => onCritiqueLevelChange(v as CritiqueLevel)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Critique level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light — encouraging</SelectItem>
              <SelectItem value="balanced">Balanced — honest</SelectItem>
              <SelectItem value="hardcore">Hardcore — brutally honest</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="w-full"
            size="sm"
            color="primary"
            variant="solid"
            onPress={onAnalyzeResume}
            isDisabled={!resumeUploaded || isAnalyzing || isUploading}
          >
            {isAnalyzing ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Analyzing...</>
            ) : (
              <><WandSparkles className="mr-1.5 h-3.5 w-3.5" />Analyze Resume</>
            )}
          </Button>
        </div>

        {/* Analysis results */}
        {analysis && (
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/10 bg-background/45 p-2.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground">General Score</span>
              <Chip
                size="sm"
                variant="solid"
                color="primary"
                className="text-xs"
              >
                {analysis.score}/100
              </Chip>
            </div>
            <p className="text-xs text-muted-foreground italic">{analysis.headline}</p>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Strengths</p>
              <ul className="mt-1 space-y-0.5">
                {analysis.strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-xs leading-relaxed">+ {s}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Gaps</p>
              <ul className="mt-1 space-y-0.5">
                {analysis.gaps.slice(0, 3).map((g, i) => (
                  <li key={i} className="text-xs leading-relaxed text-muted-foreground">- {g}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Priority Actions</p>
              <ul className="mt-1 space-y-0.5">
                {analysis.priority_actions.slice(0, 3).map((a, i) => (
                  <li key={i} className="text-xs leading-relaxed">→ {a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* No analysis yet — show optimize mode selector + instructions */}
        {!analysis && (
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/10 bg-background/45 p-2.5 space-y-2.5">
            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                Role Optimization Mode
              </span>
              <Select value={optimizeMode} onValueChange={(v) => onOptimizeModeChange(v as OptimizeMode)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullets">Bullet improvements</SelectItem>
                  <SelectItem value="overview">Summary rewrite</SelectItem>
                  <SelectItem value="full_rewrite">Full resume rewrite</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">{OPTIMIZE_MODE_DESCRIPTIONS[optimizeMode]}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload a resume, then click <span className="font-medium text-foreground">Optimize For This Role</span> on any job card or in the job detail view.
            </p>
          </div>
        )}

        {/* Optimize mode selector shown below analysis when analysis is visible */}
        {analysis && (
          <div className="space-y-1.5">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Role Optimization Mode
            </span>
            <Select value={optimizeMode} onValueChange={(v) => onOptimizeModeChange(v as OptimizeMode)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bullets">Bullet improvements</SelectItem>
                <SelectItem value="overview">Summary rewrite</SelectItem>
                <SelectItem value="full_rewrite">Full resume rewrite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-2 text-xs text-destructive">
            {errorMessage}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
