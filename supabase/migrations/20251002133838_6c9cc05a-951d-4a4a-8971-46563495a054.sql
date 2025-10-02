-- Adicionar novos roles ao sistema
-- Primeiro, vamos criar os roles como valores permitidos

-- Inserir comentário para documentação dos roles disponíveis:
-- admin: Administração geral
-- support: Atendimento/Chat ao vivo  
-- technology: Tecnologia/TI
-- marketing: Marketing
-- management: Gestão/Administração

COMMENT ON COLUMN user_roles.role IS 'Roles disponíveis: admin, support, technology, marketing, management';