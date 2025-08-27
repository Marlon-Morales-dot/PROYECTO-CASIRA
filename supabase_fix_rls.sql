-- ============================================================================
-- CASIRA CONNECT - ARREGLO DE POLÍTICAS RLS
-- ============================================================================

-- 1. DESACTIVAR RLS TEMPORALMENTE PARA USERS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES QUE CAUSAN RECURSIÓN
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Public can insert users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- 3. CREAR POLÍTICAS RLS SIMPLES Y CORRECTAS
-- Permitir a todos ver perfiles públicos básicos
CREATE POLICY "Enable read access for authenticated users" ON users
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Permitir inserción para usuarios autenticados (registro)
CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Permitir a usuarios actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE 
    USING (auth.uid() = id);

-- Permitir a admins hacer todo (usando rol específico en tabla users)
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 4. REACTIVAR RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS PARA OTRAS TABLAS IMPORTANTES
-- ============================================================================

-- ACTIVITIES - Todos pueden ver actividades públicas
DROP POLICY IF EXISTS "Enable read access for all users" ON activities;
CREATE POLICY "Enable read access for public activities" ON activities
    FOR SELECT 
    USING (visibility = 'public' OR auth.role() = 'authenticated');

-- Solo usuarios autenticados pueden crear actividades
CREATE POLICY "Authenticated users can create activities" ON activities
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Solo creadores o admins pueden modificar actividades
CREATE POLICY "Users can update own activities or admins all" ON activities
    FOR UPDATE 
    USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- POSTS - Políticas para red social
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;
CREATE POLICY "Enable read access for public posts" ON posts
    FOR SELECT 
    USING (visibility = 'public' OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create posts" ON posts
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own posts or admins all" ON posts
    FOR UPDATE 
    USING (
        author_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- ACTIVITY_PARTICIPANTS - Para voluntarios
CREATE POLICY "Users can view activity participants" ON activity_participants
    FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can join activities" ON activity_participants
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- FUNCIONES DE UTILIDAD
-- ============================================================================

-- Función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND role = 'admin'
    );
$$;

-- Función para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT role FROM users WHERE id = user_id),
        'visitor'
    );
$$;

-- ============================================================================
-- TRIGGERS PARA MANTENER CONSISTENCIA
-- ============================================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a tablas relevantes
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();