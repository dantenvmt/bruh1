import type { ChangeEvent } from 'react';
import { FileText, Loader2, Trash2, Upload, WandSparkles } from 'lucide-react';

import type { CritiqueLevel, ResumeAnalysisResponse } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ResumeLabPanelProps {
  resumeFileName: string | null;
  resumeText: string;
  critiqueLevel: CritiqueLevel;
  onCritiqueLevelChange: (value: CritiqueLevel) => void;
  onUpload: (file: File) => void;
  onClearResume: () => void;
  onAnalyzeResume: () => void;
  isExtracting: boolean;
  isAnalyzing: boolean;
  analysis: ResumeAnalysisResponse | null;
  errorMessage: string | null;
}

function critiqueLabel(level: CritiqueLevel): string {
  if (level === 'light') return 'Light';
  if (level === 'hardcore') return 'Hardcore';
  return 'Balanced';
}

export function ResumeLabPanel({
  resumeFileName,
  resumeText,
  critiqueLevel,
  onCritiqueLevelChange,
  onUpload,
  onClearResume,
  onAnalyzeResume,
  isExtracting,
  isAnalyzing,
  analysis,
  errorMessage,
}: ResumeLabPanelProps) {
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.currentTarget.value = '';
  };

  const ready = Boolean(resumeText.trim());

  return (
    <Card className="h-full rounded-[1.3rem] border-border/70 bg-card/85 p-3 shadow-xl shadow-black/25 backdrop-blur">
      <div className="flex h-full flex-col">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Resume Lab
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-tight">AI Resume Optimization</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Guest mode: resume stays in this browser session only.
          </p>
        </div>

        <div className="mt-3 space-y-2.5">
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Upload Resume
            </span>
            <Input
              type="file"
              accept=".pdf,.docx,.txt,.md,.rtf"
              onChange={onFileChange}
              disabled={isExtracting}
            />
          </label>

          <div className="rounded-xl border border-border/60 bg-background/45 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">Current resume</div>
              {resumeFileName && (
                <Button variant="ghost" size="sm" onClick={onClearResume}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span className="truncate">
                {resumeFileName || (ready ? 'Pasted resume text loaded' : 'No resume loaded')}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {ready ? `${resumeText.length.toLocaleString()} chars extracted` : 'Upload to enable scoring'}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Critique Level
            </span>
            <Select
              value={critiqueLevel}
              onValueChange={(v) => onCritiqueLevelChange(v as CritiqueLevel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select critique level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="hardcore">Hardcore</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-1 text-xs text-muted-foreground">
              Mode: {critiqueLabel(critiqueLevel)}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={onAnalyzeResume}
            disabled={!ready || isAnalyzing || isExtracting}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <WandSparkles className="mr-2 h-4 w-4" />
                Analyze Resume
              </>
            )}
          </Button>

          {isExtracting && (
            <div className="rounded-lg border border-border/50 bg-background/50 p-2 text-xs text-muted-foreground">
              <Upload className="mr-1 inline h-3.5 w-3.5" />
              Extracting text from resume...
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-2 text-xs text-destructive">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-xl border border-border/60 bg-background/45 p-2.5">
          {!analysis ? (
            <div className="text-xs leading-relaxed text-muted-foreground">
              Run a general analysis to get baseline score, strengths, and improvements.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">General Score</div>
                <Badge className="bg-primary/90 text-primary-foreground">{analysis.score}/100</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{analysis.headline}</p>

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Top Strengths
                </div>
                <ul className="mt-1 space-y-1 text-xs">
                  {analysis.strengths.slice(0, 3).map((item, idx) => (
                    <li key={`s-${idx}`} className="leading-relaxed">- {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Priority Actions
                </div>
                <ul className="mt-1 space-y-1 text-xs">
                  {analysis.priority_actions.slice(0, 3).map((item, idx) => (
                    <li key={`a-${idx}`} className="leading-relaxed">- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
