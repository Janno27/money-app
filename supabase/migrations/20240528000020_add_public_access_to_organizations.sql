-- Ajouter une politique pour permettre à tout le monde de voir les informations de base des organisations
CREATE POLICY "Accès public en lecture au nom des organisations" 
ON public.organizations
FOR SELECT 
USING (true);

-- Alternativement, si vous souhaitez limiter l'accès aux seuls champs nécessaires, 
-- vous pouvez créer une fonction RPC ou une vue sécurisée:

CREATE OR REPLACE FUNCTION public.get_organization_name(org_id UUID) 
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT name FROM organizations WHERE id = org_id;
$$; 