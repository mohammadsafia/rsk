import { Link } from 'react-router-dom';

import { getComponentDocsRegistry } from '@component-docs/registry';
import { docsNavGroups } from '@component-docs/docs-nav';

/** Placeholder index; replaced by the card grid in the overview task. */
export default function DocsComponentsPage() {
  const groups = docsNavGroups(getComponentDocsRegistry());

  return (
    <ul className="p-6">
      {groups
        .flatMap((group) => group.items)
        .map((item) => (
          <li key={item.id}>
            <Link to={item.href}>{item.title}</Link>
          </li>
        ))}
    </ul>
  );
}
