--
-- PostgreSQL database dump
--

\restrict k0mcM1oBevJwT7ttRAuKggsy3cgdY1WDPRFjc8pwRZT4J3wOAMAzyQCbTeiiPHe

-- Dumped from database version 17.12 (Debian 17.12-1.pgdg13+1)
-- Dumped by pg_dump version 17.12 (Debian 17.12-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    course_id integer NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.announcements OWNER TO lms;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO lms;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.assignment_submissions (
    id integer NOT NULL,
    assignment_id integer NOT NULL,
    student_id integer NOT NULL,
    submission_type character varying(10),
    text_content text,
    file_path character varying(100),
    original_filename character varying(255),
    submitted_at timestamp with time zone,
    points_earned integer,
    feedback text NOT NULL,
    graded_at timestamp with time zone,
    graded_by integer,
    CONSTRAINT submission_nonnegative_grade CHECK (((points_earned IS NULL) OR (points_earned >= 0)))
);


ALTER TABLE public.assignment_submissions OWNER TO lms;

--
-- Name: assignment_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.assignment_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignment_submissions_id_seq OWNER TO lms;

--
-- Name: assignment_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.assignment_submissions_id_seq OWNED BY public.assignment_submissions.id;


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.assignments (
    id integer NOT NULL,
    course_id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    due_at timestamp with time zone NOT NULL,
    max_points integer NOT NULL,
    submission_type character varying(10) NOT NULL,
    instructions_file character varying(100),
    instructions_filename character varying(255),
    CONSTRAINT assignment_positive_points CHECK ((max_points > 0)),
    CONSTRAINT assignment_valid_type CHECK (((submission_type)::text = ANY ((ARRAY['TEXT'::character varying, 'PDF'::character varying, 'BOTH'::character varying])::text[])))
);


ALTER TABLE public.assignments OWNER TO lms;

--
-- Name: assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignments_id_seq OWNER TO lms;

--
-- Name: assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.assignments_id_seq OWNED BY public.assignments.id;


--
-- Name: course_join_codes; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.course_join_codes (
    id integer NOT NULL,
    course_id integer NOT NULL,
    code character varying(12) NOT NULL
);


ALTER TABLE public.course_join_codes OWNER TO lms;

--
-- Name: course_join_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.course_join_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_join_codes_id_seq OWNER TO lms;

--
-- Name: course_join_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.course_join_codes_id_seq OWNED BY public.course_join_codes.id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    description text NOT NULL,
    instructor_id integer NOT NULL
);


ALTER TABLE public.courses OWNER TO lms;

--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_id_seq OWNER TO lms;

--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: curriculum_materials; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.curriculum_materials (
    id integer NOT NULL,
    module_id integer NOT NULL,
    title character varying(200) NOT NULL,
    type character varying(10) NOT NULL,
    content text,
    file_path character varying(200),
    "position" integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.curriculum_materials OWNER TO lms;

--
-- Name: curriculum_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.curriculum_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.curriculum_materials_id_seq OWNER TO lms;

--
-- Name: curriculum_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.curriculum_materials_id_seq OWNED BY public.curriculum_materials.id;


--
-- Name: curriculum_modules; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.curriculum_modules (
    id integer NOT NULL,
    course_id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    "position" integer NOT NULL
);


ALTER TABLE public.curriculum_modules OWNER TO lms;

--
-- Name: curriculum_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.curriculum_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.curriculum_modules_id_seq OWNER TO lms;

--
-- Name: curriculum_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.curriculum_modules_id_seq OWNED BY public.curriculum_modules.id;


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.enrollments (
    id integer NOT NULL,
    course_id integer NOT NULL,
    student_id integer NOT NULL
);


ALTER TABLE public.enrollments OWNER TO lms;

--
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollments_id_seq OWNER TO lms;

--
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    quiz_id integer NOT NULL,
    "position" integer NOT NULL,
    text text NOT NULL,
    option_a text NOT NULL,
    option_b text NOT NULL,
    option_c text NOT NULL,
    option_d text NOT NULL,
    correct integer NOT NULL,
    CONSTRAINT question_correct_range CHECK (((correct >= 0) AND (correct <= 3)))
);


ALTER TABLE public.questions OWNER TO lms;

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_id_seq OWNER TO lms;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: quiz_answers; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.quiz_answers (
    id integer NOT NULL,
    submission_id integer NOT NULL,
    question_id integer NOT NULL,
    selected integer NOT NULL,
    is_correct boolean NOT NULL,
    CONSTRAINT answer_selected_range CHECK (((selected >= 0) AND (selected <= 3)))
);


ALTER TABLE public.quiz_answers OWNER TO lms;

--
-- Name: quiz_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.quiz_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_answers_id_seq OWNER TO lms;

--
-- Name: quiz_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.quiz_answers_id_seq OWNED BY public.quiz_answers.id;


--
-- Name: quiz_submissions; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.quiz_submissions (
    id integer NOT NULL,
    quiz_id integer NOT NULL,
    student_id integer NOT NULL,
    score integer NOT NULL,
    total integer NOT NULL,
    submitted_at timestamp with time zone NOT NULL
);


ALTER TABLE public.quiz_submissions OWNER TO lms;

--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.quiz_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_submissions_id_seq OWNER TO lms;

--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.quiz_submissions_id_seq OWNED BY public.quiz_submissions.id;


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.quizzes (
    id integer NOT NULL,
    course_id integer NOT NULL,
    title character varying(200) NOT NULL,
    due_date date NOT NULL,
    max_points integer
);


ALTER TABLE public.quizzes OWNER TO lms;

--
-- Name: quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.quizzes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quizzes_id_seq OWNER TO lms;

--
-- Name: quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.quizzes_id_seq OWNED BY public.quizzes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: lms
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL
);


ALTER TABLE public.users OWNER TO lms;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: lms
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO lms;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lms
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: assignment_submissions id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.assignment_submissions ALTER COLUMN id SET DEFAULT nextval('public.assignment_submissions_id_seq'::regclass);


--
-- Name: assignments id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.assignments ALTER COLUMN id SET DEFAULT nextval('public.assignments_id_seq'::regclass);


--
-- Name: course_join_codes id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.course_join_codes ALTER COLUMN id SET DEFAULT nextval('public.course_join_codes_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: curriculum_materials id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.curriculum_materials ALTER COLUMN id SET DEFAULT nextval('public.curriculum_materials_id_seq'::regclass);


--
-- Name: curriculum_modules id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.curriculum_modules ALTER COLUMN id SET DEFAULT nextval('public.curriculum_modules_id_seq'::regclass);


--
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: quiz_answers id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quiz_answers ALTER COLUMN id SET DEFAULT nextval('public.quiz_answers_id_seq'::regclass);


--
-- Name: quiz_submissions id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quiz_submissions ALTER COLUMN id SET DEFAULT nextval('public.quiz_submissions_id_seq'::regclass);


--
-- Name: quizzes id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quizzes ALTER COLUMN id SET DEFAULT nextval('public.quizzes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.announcements (id, course_id, title, content, created_at) FROM stdin;
\.


--
-- Data for Name: assignment_submissions; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.assignment_submissions (id, assignment_id, student_id, submission_type, text_content, file_path, original_filename, submitted_at, points_earned, feedback, graded_at, graded_by) FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.assignments (id, course_id, title, description, due_at, max_points, submission_type, instructions_file, instructions_filename) FROM stdin;
\.


--
-- Data for Name: course_join_codes; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.course_join_codes (id, course_id, code) FROM stdin;
1	1	8401EC2848
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.courses (id, name, description, instructor_id) FROM stdin;
1	Introduction to Programming	Introductory Python programming course.	2
\.


--
-- Data for Name: curriculum_materials; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.curriculum_materials (id, module_id, title, type, content, file_path, "position", created_at, updated_at) FROM stdin;
1	1	ACE Letter	PDF	\N	41f53df6-f34b-493e-b581-f6745f407b74.pdf	1	2026-11-14 23:03:20.333765+00	2026-11-14 23:03:20.333776+00
\.


--
-- Data for Name: curriculum_modules; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.curriculum_modules (id, course_id, title, description, "position") FROM stdin;
1	1	Syllabus Week	Read here for the syllabuis	1
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.enrollments (id, course_id, student_id) FROM stdin;
1	1	1
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.questions (id, quiz_id, "position", text, option_a, option_b, option_c, option_d, correct) FROM stdin;
\.


--
-- Data for Name: quiz_answers; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.quiz_answers (id, submission_id, question_id, selected, is_correct) FROM stdin;
\.


--
-- Data for Name: quiz_submissions; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.quiz_submissions (id, quiz_id, student_id, score, total, submitted_at) FROM stdin;
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.quizzes (id, course_id, title, due_date, max_points) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: lms
--

COPY public.users (id, name, email, password_hash, role) FROM stdin;
1	Aiden Seay	aidengseay@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$lbVez76kGOsD42uxt1WomQ$B1v8n6s9EXeusR9LEc/dpDlXSbrj/erH7XkH6fc+dik	STUDENT
2	Kaleb Stilson	ags392@nau.edu	$argon2id$v=19$m=65536,t=3,p=4$HfzqZKSKwt6Fvw5ky04gFg$UmeNXEna4kuNL4HhSn7LAWNQe+5xTJ5Rlm/veywZG7s	INSTRUCTOR
\.


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, false);


--
-- Name: assignment_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.assignment_submissions_id_seq', 1, false);


--
-- Name: assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.assignments_id_seq', 1, false);


--
-- Name: course_join_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.course_join_codes_id_seq', 1, true);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.courses_id_seq', 1, true);


--
-- Name: curriculum_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.curriculum_materials_id_seq', 1, true);


--
-- Name: curriculum_modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.curriculum_modules_id_seq', 1, true);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 1, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.questions_id_seq', 1, false);


--
-- Name: quiz_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.quiz_answers_id_seq', 1, false);


--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.quiz_submissions_id_seq', 1, false);


--
-- Name: quizzes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.quizzes_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lms
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: assignment_submissions assignment_submissions_assignment_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_student_id_key UNIQUE (assignment_id, student_id);


--
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: course_join_codes course_join_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.course_join_codes
    ADD CONSTRAINT course_join_codes_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: curriculum_materials curriculum_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.curriculum_materials
    ADD CONSTRAINT curriculum_materials_pkey PRIMARY KEY (id);


--
-- Name: curriculum_modules curriculum_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.curriculum_modules
    ADD CONSTRAINT curriculum_modules_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_course_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_student_id_key UNIQUE (course_id, student_id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: questions questions_quiz_id_position_key; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_quiz_id_position_key UNIQUE (quiz_id, "position");


--
-- Name: quiz_answers quiz_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_pkey PRIMARY KEY (id);


--
-- Name: quiz_answers quiz_answers_submission_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_submission_id_question_id_key UNIQUE (submission_id, question_id);


--
-- Name: quiz_submissions quiz_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_pkey PRIMARY KEY (id);


--
-- Name: quiz_submissions quiz_submissions_quiz_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_quiz_id_student_id_key UNIQUE (quiz_id, student_id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_announcements_course_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE INDEX ix_announcements_course_id ON public.announcements USING btree (course_id);


--
-- Name: ix_assignment_submissions_assignment_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE INDEX ix_assignment_submissions_assignment_id ON public.assignment_submissions USING btree (assignment_id);


--
-- Name: ix_assignment_submissions_student_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE INDEX ix_assignment_submissions_student_id ON public.assignment_submissions USING btree (student_id);


--
-- Name: ix_assignments_course_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE INDEX ix_assignments_course_id ON public.assignments USING btree (course_id);


--
-- Name: ix_course_join_codes_code; Type: INDEX; Schema: public; Owner: lms
--

CREATE UNIQUE INDEX ix_course_join_codes_code ON public.course_join_codes USING btree (code);


--
-- Name: ix_course_join_codes_course_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE UNIQUE INDEX ix_course_join_codes_course_id ON public.course_join_codes USING btree (course_id);


--
-- Name: ix_curriculum_materials_module_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE INDEX ix_curriculum_materials_module_id ON public.curriculum_materials USING btree (module_id);


--
-- Name: ix_curriculum_modules_course_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE INDEX ix_curriculum_modules_course_id ON public.curriculum_modules USING btree (course_id);


--
-- Name: ix_questions_quiz_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE INDEX ix_questions_quiz_id ON public.questions USING btree (quiz_id);


--
-- Name: ix_quiz_answers_submission_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE INDEX ix_quiz_answers_submission_id ON public.quiz_answers USING btree (submission_id);


--
-- Name: ix_quiz_submissions_quiz_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE INDEX ix_quiz_submissions_quiz_id ON public.quiz_submissions USING btree (quiz_id);


--
-- Name: ix_quiz_submissions_student_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE INDEX ix_quiz_submissions_student_id ON public.quiz_submissions USING btree (student_id);


--
-- Name: ix_quizzes_course_id; Type: INDEX; Schema: public; Owner: lms
--

CREATE INDEX ix_quizzes_course_id ON public.quizzes USING btree (course_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: lms
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: announcements announcements_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: assignment_submissions assignment_submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id);


--
-- Name: assignment_submissions assignment_submissions_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.users(id);


--
-- Name: assignment_submissions assignment_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: assignments assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: course_join_codes course_join_codes_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.course_join_codes
    ADD CONSTRAINT course_join_codes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id);


--
-- Name: curriculum_materials curriculum_materials_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.curriculum_materials
    ADD CONSTRAINT curriculum_materials_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.curriculum_modules(id);


--
-- Name: curriculum_modules curriculum_modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.curriculum_modules
    ADD CONSTRAINT curriculum_modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: enrollments enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: questions questions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id);


--
-- Name: quiz_answers quiz_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id);


--
-- Name: quiz_answers quiz_answers_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.quiz_submissions(id);


--
-- Name: quiz_submissions quiz_submissions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id);


--
-- Name: quiz_submissions quiz_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: quizzes quizzes_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: lms
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- PostgreSQL database dump complete
--

\unrestrict k0mcM1oBevJwT7ttRAuKggsy3cgdY1WDPRFjc8pwRZT4J3wOAMAzyQCbTeiiPHe

