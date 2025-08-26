-- CASIRA Database Schema
-- Base de datos para sistema de gestión de actividades y voluntarios

-- 1. Tabla de usuarios (extendida para manejar roles)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'volunteer' CHECK (role IN ('admin', 'volunteer', 'donor', 'beneficiary')),
    bio TEXT,
    avatar_url TEXT,
    phone TEXT,
    location TEXT,
    skills TEXT[], -- Array de habilidades del voluntario
    availability TEXT, -- Disponibilidad del voluntario
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de categorías de actividades
CREATE TABLE IF NOT EXISTS public.activity_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6', -- Color para la UI
    icon TEXT, -- Icono para la categoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de actividades/proyectos
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    detailed_description TEXT,
    category_id UUID REFERENCES public.activity_categories(id),
    created_by UUID REFERENCES public.users(id) NOT NULL,
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    location TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_volunteers INTEGER,
    current_volunteers INTEGER DEFAULT 0,
    budget DECIMAL(10,2),
    funds_raised DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    gallery JSONB, -- Array de imágenes adicionales
    requirements TEXT[], -- Requisitos para voluntarios
    benefits TEXT[], -- Beneficios/impacto esperado
    contact_info JSONB, -- Información de contacto
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'volunteers_only')),
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de eventos (eventos específicos dentro de actividades)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER, -- Duración en minutos
    location TEXT,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    requirements TEXT[],
    created_by UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de participación en actividades
CREATE TABLE IF NOT EXISTS public.activity_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'volunteer' CHECK (role IN ('volunteer', 'coordinator', 'donor')),
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    hours_contributed INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- 6. Tabla de participación en eventos
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'no_show')),
    notes TEXT,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 7. Tabla de publicaciones/updates
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    post_type TEXT DEFAULT 'update' CHECK (post_type IN ('update', 'announcement', 'milestone', 'request')),
    images JSONB, -- Array de URLs de imágenes
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'volunteers_only', 'private')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabla de comentarios
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id), -- Para respuestas
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabla de donaciones
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID REFERENCES public.activities(id),
    donor_id UUID REFERENCES public.users(id),
    donor_name TEXT, -- Para donantes anónimos
    donor_email TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'GTQ',
    donation_type TEXT DEFAULT 'monetary' CHECK (donation_type IN ('monetary', 'material', 'service')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
    payment_method TEXT,
    transaction_id TEXT,
    anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabla de recursos/materiales
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    resource_type TEXT CHECK (resource_type IN ('material', 'equipment', 'service', 'document')),
    quantity_needed INTEGER,
    quantity_available INTEGER DEFAULT 0,
    unit TEXT, -- unidad de medida
    estimated_cost DECIMAL(10,2),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'needed' CHECK (status IN ('needed', 'partial', 'fulfilled')),
    provided_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_featured ON public.activities(featured);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.activities(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_activity ON public.posts(activity_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_participants_activity ON public.activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.activity_participants(user_id);

-- Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad básicas
-- Los usuarios pueden ver y editar su propio perfil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Los admins pueden ver y editar todo
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Actividades públicas son visibles para todos
CREATE POLICY "Public activities are viewable by everyone" ON public.activities
    FOR SELECT USING (visibility = 'public');

-- Solo usuarios autenticados pueden crear actividades
CREATE POLICY "Authenticated users can create activities" ON public.activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Los creadores pueden editar sus actividades
CREATE POLICY "Users can edit own activities" ON public.activities
    FOR UPDATE USING (created_by = auth.uid());

-- Los admins pueden editar cualquier actividad
CREATE POLICY "Admins can edit all activities" ON public.activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insertar datos iniciales
INSERT INTO public.activity_categories (name, description, color, icon) VALUES
('Educación', 'Proyectos relacionados con educación y capacitación', '#3B82F6', '📚'),
('Salud', 'Iniciativas de salud comunitaria', '#EF4444', '🏥'),
('Infraestructura', 'Construcción y mejoramiento de infraestructura', '#F59E0B', '🏗️'),
('Medio Ambiente', 'Proyectos de conservación y sostenibilidad', '#10B981', '🌱'),
('Tecnología', 'Iniciativas de inclusión digital', '#8B5CF6', '💻'),
('Alimentación', 'Programas de seguridad alimentaria', '#F97316', '🍽️');

-- Insertar usuario admin
INSERT INTO public.users (id, email, first_name, last_name, role, bio) VALUES
('9e8385dc-cf3b-4f6e-87dc-e287c6d444c6', 'mmoralesc54@miumg.edu.gt', 'Administrador', 'CASIRA', 'admin', 'Administrador principal de la plataforma CASIRA')
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    first_name = 'Administrador',
    last_name = 'CASIRA',
    bio = 'Administrador principal de la plataforma CASIRA';