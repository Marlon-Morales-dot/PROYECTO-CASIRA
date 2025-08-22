-- Tabla de usuarios
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'visitor',
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de proyectos
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  progress_percentage INTEGER DEFAULT 0,
  location TEXT,
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de posts
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  image_url TEXT,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  visibility TEXT DEFAULT 'public',
  status TEXT DEFAULT 'published',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar datos demo
INSERT INTO users (email, first_name, last_name, role, bio) VALUES
('admin@casira.org', 'Administrador', 'CASIRA', 'admin', 'Administrador principal de la plataforma CASIRA Connect'),
('donante@ejemplo.com', 'María', 'González', 'donor', 'Empresaria comprometida con la educación en Guatemala');

INSERT INTO projects (title, description, image_url, status, progress_percentage, location) VALUES
('Nueva Biblioteca en San Juan', 'Gracias a nuestros donantes, 300 niños ahora tienen acceso a libros y tecnología', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', 'completed', 100, 'San Juan Palencia, Guatemala'),
('Laboratorio de Ciencias Renovado', 'El Liceo San Francisco ahora cuenta con equipamiento moderno para experimentos', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500', 'active', 85, 'Liceo San Francisco de Asís'),
('Centro Comunitario Construido', 'Un espacio de encuentro que fortalece los lazos de toda la comunidad', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500', 'active', 60, 'Palencia, Guatemala');