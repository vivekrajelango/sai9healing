CREATE TABLE forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('short_text', 'long_text', 'single_choice', 'multiple_choice', 'true_false', 'number')),
  options JSONB NOT NULL DEFAULT '[]',
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  respondent_name TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  respondent_phone TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_options JSONB NOT NULL DEFAULT '[]'
);
