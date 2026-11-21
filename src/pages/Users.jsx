import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListMusic, Pencil, ShieldCheck, Trash2, Users as UsersIcon } from 'lucide-react';
import { api, fieldError } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useLists, useSave, useUsers } from '../lib/data.js';
import { matches, plural, ROLE_LABEL } from '../lib/format.js';
import { Alert, Badge, Button, Card, ConfirmDelete, Empty, Field, Input, Modal, PageHeader, SearchInput, Segmented, Spinner, useToast } from '../components/ui.jsx';

const isAdmin = (user) => user.roles?.some((r) => r.authority === 'ROLE_ADMIN');

function Avatar({ name }) {
  const initials = (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  // cor estável a partir do nome
  const hue = [...(name ?? '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: `hsl(${hue} 35% 42%)` }}>
      {initials}
    </span>
  );
}

function EditUser({ user, onClose }) {
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [touched, setTouched] = useState(false);
  const save = useSave((body) => api.put(`/users/${user.id}`, body), ['users', 'lists']);
  const clean = name.trim().replace(/\s+/g, ' ');
  const error = (touched && clean.length < 3 ? 'Informe o nome (mínimo 3 caracteres).' : null) ?? fieldError(save.error, 'name');
  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (clean.length < 3) return;
    save.mutate({ name: clean }, { onSuccess: () => (toast(`Nome atualizado para “${clean}”.`), onClose()) });
  };
  return (
    <Modal
      title="Editar usuário"
      description="O e-mail é o login do ouvinte e não pode ser alterado."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="user-form" loading={save.isPending}>Salvar</Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-4 pb-2" noValidate>
        <Field label="Nome" error={error}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus invalid={Boolean(error)} />
        </Field>
        <Field label="E-mail">
          <Input value={user.email} disabled />
        </Field>
        {save.error && !save.error.fields?.length && <Alert>{save.error.message}</Alert>}
      </form>
    </Modal>
  );
}

export default function Users() {
  const toast = useToast();
  const { user: me } = useAuth();
  const { data: users, isLoading, error } = useUsers();
  const lists = useLists().data ?? [];
  const [q, setQ] = useState('');
  const [role, setRole] = useState('todos');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const remove = useSave((user) => api.del(`/users/${user.id}`), ['users', 'lists']);

  const listsByOwner = useMemo(() => {
    const map = new Map();
    for (const l of lists) map.set(l.owner?.id, (map.get(l.owner?.id) ?? 0) + 1);
    return map;
  }, [lists]);

  if (isLoading) return <Spinner />;
  if (error) return <Alert>{error.message}</Alert>;

  const admins = users.filter(isAdmin).length;
  const filtered = users.filter((u) => matches(q, u.name, u.email) && (role === 'todos' || (role === 'admin' ? isAdmin(u) : !isAdmin(u))));

  return (
    <div>
      <PageHeader
        title="Usuários"
        description={`${plural(users.length, 'conta', 'contas')}: ${plural(admins, 'administrador', 'administradores')} e ${plural(users.length - admins, 'ouvinte', 'ouvintes')}. As contas são criadas pelo próprio app.`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por nome ou e-mail…" className="min-w-[14rem] flex-1 sm:max-w-sm" />
        <Segmented label="Perfil" value={role} onChange={setRole} options={[['todos', 'Todos'], ['ouvinte', 'Ouvintes'], ['admin', 'Administradores', ShieldCheck]]} />
        <span className="num ml-auto text-xs text-gray-500">{plural(filtered.length, 'usuário', 'usuários')}</span>
      </div>

      <Card flush>
        {filtered.length === 0 ? (
          <Empty icon={UsersIcon} title="Nenhum usuário encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-950/40">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Usuário</th>
                  <th className="hidden px-4 py-2.5 font-medium md:table-cell">Perfil</th>
                  <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Listas</th>
                  <th className="w-24 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((user) => {
                  const own = listsByOwner.get(user.id) ?? 0;
                  const self = user.id === me?.id || user.email === me?.email;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} />
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {user.name}
                              {self && <span className="ml-2 text-xs font-normal text-gray-400">(você)</span>}
                            </p>
                            <p className="truncate text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(user.roles ?? []).map((r) => (
                            <Badge key={r.authority} tone={r.authority === 'ROLE_ADMIN' ? 'green' : 'gray'}>{ROLE_LABEL[r.authority] ?? r.authority}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        {own ? (
                          <Link to={`/listas?dono=${user.id}`} className="inline-flex items-center gap-1.5 text-gray-700 hover:text-brand-ink hover:underline dark:text-gray-300">
                            <ListMusic size={14} />
                            <span className="num">{own}</span>
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button variant="ghost" size="icon" aria-label={`Editar ${user.name}`} onClick={() => setEditing(user)}><Pencil size={15} /></Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Excluir ${user.name}`}
                            disabled={self}
                            title={self ? 'Você não pode excluir a própria conta' : undefined}
                            onClick={() => setDeleting(user)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && <EditUser user={editing} onClose={() => setEditing(null)} />}

      {deleting && (
        <ConfirmDelete
          title="Excluir usuário?"
          typeToConfirm={deleting.email}
          loading={remove.isPending}
          error={remove.error?.message}
          onCancel={() => (remove.reset(), setDeleting(null))}
          onConfirm={() => remove.mutate(deleting, { onSuccess: () => (toast(`Conta de ${deleting.name} excluída.`), setDeleting(null)) })}
        >
          <p>
            A conta de <strong className="text-gray-900 dark:text-gray-100">{deleting.name}</strong> deixa de existir e o ouvinte não consegue mais entrar no app.
          </p>
          {(listsByOwner.get(deleting.id) ?? 0) > 0 && (
            <p className="mt-2 text-amber-700 dark:text-amber-300">Ele tem {plural(listsByOwner.get(deleting.id), 'lista salva', 'listas salvas')}.</p>
          )}
          {isAdmin(deleting) && <p className="mt-2 text-amber-700 dark:text-amber-300">Atenção: é uma conta de administrador.</p>}
        </ConfirmDelete>
      )}
    </div>
  );
}
