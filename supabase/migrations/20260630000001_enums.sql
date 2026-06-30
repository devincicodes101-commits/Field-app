-- All PostgreSQL enum types for Field Service App

CREATE TYPE user_role AS ENUM ('office', 'contractor');
CREATE TYPE job_status AS ENUM ('quote_sent', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE message_sender_role AS ENUM ('office', 'client', 'contractor');
CREATE TYPE photo_kind AS ENUM ('client_reference', 'completion');
CREATE TYPE extra_work_status AS ENUM ('pending', 'approved', 'rejected');
