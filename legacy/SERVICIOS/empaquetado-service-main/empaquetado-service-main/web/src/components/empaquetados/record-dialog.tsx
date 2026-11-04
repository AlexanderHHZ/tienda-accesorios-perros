'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/dialog';
import { empaquetadosApi } from '@/services/empaquetados-api';
import type { ActivePanel, Empaquetado } from '@/types/empaquetado';
import { RecordForm } from './record-form';
import { RecordDetails } from './record-details';
import { DeleteConfirmation } from './delete-confirmation';
import { MeasurementGuide } from './measurement-guide';

type Props = {
  panel: ActivePanel;
  onClose: () => void;
  onEdit: (item: Empaquetado) => void;
  onSuccess: (kind: 'create' | 'edit' | 'delete') => void;
};

export function RecordDialog({ panel, onClose, onEdit, onSuccess }: Props) {
  const [busy, setBusy] = useState(false);
  if (panel.kind === 'guide')
    return (
      <Modal
        title="Cada medida cuenta"
        description="Una guía breve para registrar tus empaquetados."
        onClose={onClose}
      >
        <MeasurementGuide />
      </Modal>
    );
  if (panel.kind === 'view')
    return (
      <Modal
        title="Detalle del empaquetado"
        description="Consulta las medidas y la información del registro."
        onClose={onClose}
      >
        <RecordDetails id={panel.id} onEdit={onEdit} />
      </Modal>
    );
  if (panel.kind === 'delete')
    return (
      <Modal
        title="¿Eliminar empaquetado?"
        description="Esta acción no se puede deshacer. El registro se eliminará de forma permanente."
        onClose={onClose}
        busy={busy}
      >
        <DeleteConfirmation
          item={panel.item}
          busy={busy}
          onBusy={setBusy}
          onClose={onClose}
          onDeleted={() => onSuccess('delete')}
        />
      </Modal>
    );
  const item = panel.kind === 'edit' ? panel.item : undefined;
  return (
    <Modal
      title={item ? 'Editar empaquetado' : 'Nuevo empaquetado'}
      description="Registra las características del paquete. Todos los campos son obligatorios."
      onClose={onClose}
      busy={busy}
    >
      <RecordForm
        item={item}
        busy={busy}
        onBusy={setBusy}
        onClose={onClose}
        onSave={async (input) => {
          if (item) await empaquetadosApi.update(item.id, input, item.updatedAt);
          else await empaquetadosApi.create(input);
          onSuccess(item ? 'edit' : 'create');
        }}
      />
    </Modal>
  );
}
