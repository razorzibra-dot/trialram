import { Modal } from 'antd';

export interface ConfirmDeleteOptions {
  title?: string;
  description?: string;
  okText?: string;
  cancelText?: string;
}

export const useConfirmDelete = () => {
  const confirmDelete = async (options: ConfirmDeleteOptions = {}): Promise<boolean> => {
    const {
      title = 'Confirm Delete',
      description = 'Are you sure you want to delete this item? This action cannot be undone.',
      okText = 'Delete',
      cancelText = 'Cancel',
    } = options;

    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title,
        content: description,
        okText,
        cancelText,
        okButtonProps: { danger: true },
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };

  return { confirmDelete };
};

export default useConfirmDelete;