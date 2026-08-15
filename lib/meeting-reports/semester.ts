export type SemesterHalf = 1 | 2;

export type Semester = {
  year: number;
  half: SemesterHalf;
};

export function semesterForDate(date: Date): Semester {
  return {
    year: date.getFullYear(),
    half: date.getMonth() < 6 ? 1 : 2,
  };
}

export function currentSemester(): Semester {
  return semesterForDate(new Date());
}

export function semesterLabel(semester: Semester): string {
  return `Semester ${semester.half} ${semester.year}`;
}

export function semesterRangeLabel(semester: Semester): string {
  return semester.half === 1 ? `Januari – Juni ${semester.year}` : `Juli – Desember ${semester.year}`;
}

export function semesterKey(semester: Semester): string {
  return `${semester.year}-${semester.half}`;
}

export function areSemestersEqual(a: Semester, b: Semester): boolean {
  return a.year === b.year && a.half === b.half;
}

export function shiftSemester(semester: Semester, delta: number): Semester {
  const totalHalves = semester.year * 2 + (semester.half - 1) + delta;
  const year = Math.floor(totalHalves / 2);
  const half: SemesterHalf = totalHalves % 2 === 0 ? 1 : 2;
  return { year, half };
}
